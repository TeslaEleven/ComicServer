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
  this.oTarget = oTarget || document.documentElement;  
  
  // Single DocumentFragment to contain lights  
  this.oFrag = document.createDocumentFragment();  
  
  // Initialize the explosion box template and lights array  
  this.oExplosionBox = document.createElement('div');  
  this.oExplosionBox.className = 'xlsf-fragment-box';  
  this.oExplosionFrag = document.createElement('div');  
  this.oExplosionFrag.className = 'xlsf-fragment';  
  this.lights = [];  
  
  // Append lights to the target container  
  this.appendLights = function () {  
   // Only append if there are lights in the fragment  
   if (this.oFrag.childNodes.length > 0) {  
    this.oTarget.appendChild(this.oFrag);  
   }  
  };  
  
  // Light class and creation logic here...  
   
  // Example of adding lights to the fragment  
  this.createLight = function (sClass, nType, x, y) {  
   const light = new Light(sClass, nType, x, y);  
   this.lights.push(light);  
   this.oFrag.appendChild(light.o);  // Add each light directly to the fragment  
  };  
  
  // Add and display lights  
  for (let j = 0; j < Math.floor(window.innerWidth / 32); j++) {  
   this.createLight('top', j % 4, j * 32, 0);  
  }  
  
  // Call appendLights once all lights are added  
  this.appendLights();  
  
  // Start light sequence  
  this.startSequence();  
}  
  
// Helper for appending lights  
XLSF.prototype.appendLights = function () {  
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
  
XLSF.prototype.createLight = function (sClass, nType, x, y) {  
  const light = new Light(sClass, nType, x, y);  
  this.lights.push(light);  
  this.oFrag.appendChild(light.o);  // Add each light directly to the fragment  
  return light;  
};  
  
XLSF.prototype.randomLights = function () {  
  this.lights[Math.floor(Math.random() * this.lights.length)].toggle();  
};  
  
XLSF.prototype.destroyLight = function () {  
  if (this.lightSmashCounter < this.lights.length) {  
   this.lights[this.lightSmashCounter].smash();  
   this.lightSmashCounter++;  
  } else {  
   clearInterval(this.timer);  
  }  
};  
  
XLSF.prototype.startSequence = function () {  
  this.timer = setInterval(() => this.randomLights(), 1000); // Set interval to 1000ms  
};  
  
// Initialize the smashfest  
function smashInit() {  
  if (navigator.userAgent.includes('msie 6')) return;  
  new XLSF(document.getElementById('lights'));  
}  
  
// Set up sound manager  
soundManager.setup({  
  flashVersion: 9,  
  preferFlash: false,  
  url: 'lights/',  
  onready: smashInit,  
  ontimeout: smashInit  
});
