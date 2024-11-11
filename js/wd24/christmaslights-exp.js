function $(sID) {
  return document.getElementById(sID);
}

function XLSF(oTarget, urlBase) {
  var urlBase = (urlBase ? urlBase : 'lights/');
  var animDuration = 1;
  this.oFrag = document.createDocumentFragment();
  this.oTarget = (oTarget ? oTarget : document.documentElement);
  this.oExplosionBox = document.createElement('div');
  this.oExplosionBox.className = 'xlsf-fragment-box';
  this.oExplosionFrag = document.createElement('div');
  this.oExplosionFrag.className = 'xlsf-fragment';
  this.lights = [];
  this.lightClasses = {
    pico: 32,
    tiny: 50,
    small: 64,
    medium: 72,
    large: 96
  };

  if (window.innerWidth || window.innerHeight) {
    var screenX = window.innerWidth;
    var screenY = window.innerHeight;
  } else {
    var screenX = (document.documentElement.clientWidth || document.body.clientWidth || document.body.scrollWidth);
    var screenY = (document.documentElement.clientHeight || document.body.clientHeight || document.body.scrollHeight);
  }

  this.lightClass = (screenX > 1800 ? 'small' : 'pico');
  if (window.location.href.match(/size=/i)) {
    this.lightClass = window.location.href.substr(window.location.href.indexOf('size=') + 5);
  }
  this.lightXY = this.lightClasses[this.lightClass];

  this.lightGroups = {
    left: [],
    top: [],
    right: [],
    bottom: []
  };
  this.lightSmashCounter = 0;
  this.lightIndex = 0;
  this.lightInterval = 500;
  this.timer = null;
  this.bgBaseX = 0;
  this.bgBaseY = 0;
  this.soundIDs = 0;
  this.soundPan = {
    panValue: 75,
    left: 0,
    mid: 481,
    right: 962
  };

  this.cover = document.createElement('div');
  this.cover.className = 'xlsf-cover';
  document.documentElement.appendChild(this.cover);

  this.initSounds = function() {
    for (var i = 0; i < 6; i++) {
      soundManager.createSound({
        id: 'smash' + i,
        url: urlBase + 'sound/glass' + i + '.mp3',
        autoLoad: true,
        multiShot: true,
        volume: 50
      });
    }
    self.initSounds = function() {};
  };

  this.appendLights = function() {
    self.oTarget.appendChild(self.oFrag);
    self.oFrag = document.createDocumentFragment();
  };

  function ExplosionFragment(nType, sClass, x, y, vX, vY) {
    var self = this;
    this.o = xlsf.oExplosionFrag.cloneNode(true);
    this.nType = nType;
    this.sClass = sClass;
    this.x = x;
    this.y = y;
    this.w = 50;
    this.h = 50;
    this.vX = vX * (1.5 + Math.random());
    this.vY = vY * (1.5 + Math.random());
    this.o.style.backgroundPosition = ((this.w * -1) + 'px ' + (this.h * -nType) + 'px');

    this.burst = function() {
      // Simulate an animation for the explosion
      var marginLeft = self.vX * 8 + 'px';
      var marginTop = self.vY * 8 + 'px';
      self.o.style.transition = `margin ${animDuration}s ease-out`;
      self.o.style.marginLeft = marginLeft;
      self.o.style.marginTop = marginTop;
    };

    this.hide = function() {
      self.o.style.opacity = 0;
    };

    this.animate = function() {
      self.burst();
    };
  }

  function Light(sSizeClass, sClass, nType, x, y) {
    var self = this;
    this.o = document.createElement('div');
    this.sClass = sClass;
    this.sSizeClass = sSizeClass;
    this.nType = (nType || 0);
    this.state = null;
    this.broken = 0;
    this.w = xlsf.lightClasses[sSizeClass];
    this.h = xlsf.lightClasses[sSizeClass];
    this.x = x;
    this.y = y;
    this.o.style.width = this.w + 'px';
    this.o.style.height = this.h + 'px';
    this.o.style.background = `url(${urlBase}image/bulbs-${this.w}x${this.h}-${this.sClass}.png) no-repeat`;

    this.smash = function(e) {
      if (self.broken) return false;
      self.broken = true;
      if (soundManager && soundManager.ok()) {
        soundManager.play(self.soundID);
      }
      self.o.style.backgroundPosition = `-${self.w * 2}px 0px`;
      xlsf.lightSmashCounter++;
    };

    this.init = function() {
      self.o.className = `xlsf-light ${this.sizeClass} ${this.sClass}`;
      self.o.style.left = self.x + 'px';
      self.o.style.top = self.y + 'px';
      self.o.addEventListener('mouseover', self.smash);
      self.o.addEventListener('click', self.smash);
      xlsf.oFrag.appendChild(self.o);
    };

    this.init();
  }

  this.createLight = function(sClass, nType, x, y) {
    var oLight = new Light(self.lightClass, sClass, nType, x, y);
    self.lightGroups[sClass].push(oLight);
    self.lights.push(oLight);
    return oLight;
  };

  this.randomLights = function() {
    self.lights[parseInt(Math.random() * self.lights.length)].toggle();
  };

  this.startSequence = function(fSequence, nInterval) {
    if (self.timer) self.stopSequence();
    self.timer = window.setInterval(fSequence, nInterval ? nInterval : self.lightInterval);
  };

  this.stopSequence = function() {
    if (self.timer) {
      clearInterval(self.timer);
      self.timer = null;
    }
  };

  var jMax = Math.floor((screenX - 16) / self.lightXY);
  for (var j = 0; j < jMax; j++) {
    this.createLight('top', parseInt(j / 3) % 4, j * self.lightXY, 0);
  }
  this.appendLights();
  this.startSequence(self.randomLights);
}

var xlsf = null;

function smashInit() {
  if (navigator.userAgent.match(/msie 6/i)) {
    return false;
  }
  xlsf = new XLSF(document.getElementById('lights'));
  if ($('loading')) {
    $('loading').style.display = 'none';
  }
  xlsf.initSounds();
}

soundManager.setup({
  flashVersion: 9,
  preferFlash: false,
  url: 'lights/',
  onready: function() {
    smashInit();
  },
  ontimeout: function() {
    smashInit();
  }
});
