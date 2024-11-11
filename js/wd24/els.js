// Christmas Light Smashfest

function $(sID) {
  return document.getElementById(sID);
}

// Define utility functions for animations and easing
function animate(element, properties, duration, easing, onComplete) {
  const startValues = {};
  const deltas = {};
  const startTime = performance.now();

  for (const prop in properties) {
    startValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
    deltas[prop] = properties[prop] - startValues[prop];
  }

  function step() {
    const elapsedTime = performance.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const ease = easing ? easing(progress) : progress;

    for (const prop in properties) {
      element.style[prop] = startValues[prop] + deltas[prop] * ease + "px";
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    } else if (onComplete) {
      onComplete();
    }
  }
  requestAnimationFrame(step);
}

// Easing function for a smooth animation
const easeOutStrong = t => 1 - Math.pow(1 - t, 3);

function XLSF(oTarget, urlBase) {
  const url = urlBase || 'lights/';
  this.oFrag = document.createDocumentFragment();
  this.oTarget = oTarget || document.documentElement;
  this.oExplosionBox = document.createElement('div');
  this.oExplosionBox.className = 'xlsf-fragment-box';
  this.oExplosionFrag = document.createElement('div');
  this.oExplosionFrag.className = 'xlsf-fragment';
  this.lights = [];
  this.lightClasses = { pico: 32, tiny: 50, small: 64, medium: 72, large: 96 };

  // Determine screen size and light class
  const screenX = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const screenY = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  this.lightClass = screenX > 1800 ? 'small' : 'pico';
  this.lightXY = this.lightClasses[this.lightClass];

  this.lightGroups = { left: [], top: [], right: [], bottom: [] };
  this.lightSmashCounter = 0;
  this.lightIndex = 0;
  this.lightInterval = 500;
  this.timer = null;

  // Sounds setup
  this.initSounds = function () {
    for (let i = 0; i < 6; i++) {
      soundManager.createSound({
        id: `smash${i}`,
        url: `${url}sound/glass${i}.mp3`,
        autoLoad: true,
        multiShot: true,
        volume: 50
      });
    }
  };

  // Helper for appending lights
  this.appendLights = function () {
    this.oTarget.appendChild(this.oFrag);
    this.oFrag = document.createDocumentFragment();
  };

  // Explosion Fragment class
  function ExplosionFragment(nType, sClass, x, y, vX, vY) {
    this.o = this.oExplosionFrag.cloneNode(true);
    this.nType = nType;
    this.x = x;
    this.y = y;
    this.vX = vX * (1.5 + Math.random());
    this.vY = vY * (1.5 + Math.random());
    this.burstPhase = 1;
    this.burstPhases = 4;

    this.burst = function () {
      animate(this.o, { marginLeft: this.vX * 8, marginTop: this.vY * 8 }, 1000, easeOutStrong, () => {
        this.reset();
      });
    };

    this.reset = function () {
      this.o.style.left = '0px';
      this.o.style.top = '0px';
      this.o.style.marginLeft = '0px';
      this.o.style.marginTop = '0px';
    };
  }

  // Explosion class
  function Explosion(nType, sClass, x, y) {
    this.o = this.oExplosionBox.cloneNode(true);
    this.o.style.left = `${x}px`;
    this.o.style.top = `${y}px`;
    this.fragments = [];

    const fragmentOffsets = [
      [-5, -5], [0, -5], [5, -5],
      [-5, 0], [0, 0], [5, 0],
      [-5, 5], [0, 5], [5, 5]
    ];
    for (let [vx, vy] of fragmentOffsets) {
      this.fragments.push(new ExplosionFragment(nType, sClass, x, y, vx, vy));
    }
  }

  // Light class
  function Light(sClass, nType, x, y) {
    this.o = document.createElement('div');
    this.sClass = sClass;
    this.state = null;
    this.broken = 0;
    this.x = x;
    this.y = y;
    this.soundID = `smash${Math.floor(Math.random() * 6)}`;
    
    this.setLight = function (isOn) {
      if (this.broken || this.state === isOn) return;
      this.state = isOn;
      this.o.style.backgroundPosition = isOn ? '0px 0px' : '-32px 0px';
    };
    
    this.on = () => this.setLight(true);
    this.off = () => this.setLight(false);
    
    this.smash = () => {
      if (this.broken) return;
      this.broken = true;
      soundManager.play(this.soundID);
    };
    
    this.o.onclick = this.smash;
    this.o.onmouseover = this.smash;
    this.setLight(Math.random() > 0.5);
    this.oFrag.appendChild(this.o);
  }
  
  this.createLight = function (sClass, nType, x, y) {
    const light = new Light(sClass, nType, x, y);
    this.lightGroups[sClass].push(light);
    this.lights.push(light);
    return light;
  };
  
  this.randomLights = function () {
    this.lights[Math.floor(Math.random() * this.lights.length)].toggle();
  };
  
  this.destroyLight = function () {
    if (this.lightSmashCounter < this.lights.length) {
      this.lights[this.lightSmashCounter].smash();
      this.lightSmashCounter++;
    } else {
      clearInterval(this.timer);
    }
  };
  
  this.startSequence = function () {
    this.timer = setInterval(() => this.randomLights(), this.lightInterval);
  };
  
  $('lights').style.display = 'block';
  for (let j = 0; j < Math.floor(screenX / this.lightXY); j++) {
    this.createLight('top', j % 4, j * this.lightXY, 0);
  }
  this.appendLights();
  this.startSequence();
}

function smashInit() {
  if (navigator.userAgent.includes('msie 6')) return;
  new XLSF(document.getElementById('lights'));
}

soundManager.setup({
  flashVersion: 9,
  preferFlash: false,
  url: 'lights/',
  onready: smashInit,
  ontimeout: smashInit
});
