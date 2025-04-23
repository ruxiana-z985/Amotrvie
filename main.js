import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let headBone = null;

let speechBubbleVisible = false; // To track visibility

export function showSpeechBubble(text) {
  let bubble = document.querySelector('.speech-bubble');

  if (!bubble) {
    bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    document.getElementById('three-container').appendChild(bubble);
  }

  bubble.innerText = text;
  bubble.style.display = 'block'; // Show bubble

  speechBubbleVisible = true; // Set flag to true when shown
}

export function hideSpeechBubble() {
  let bubble = document.querySelector('.speech-bubble');
  if (bubble) {
    bubble.style.display = 'none'; // Hide bubble
  }
  speechBubbleVisible = false;
}


let scene, camera, renderer, controls, clock;
let mixer, actions = {}, currentAction;
let isModelLoaded = false;
const container=document.getElementById('three-container');
function init() {
  scene = new THREE.Scene();
  const textureloader= new THREE.TextureLoader();
  textureloader.load('grass-4642078_1920.png', function(texture) {
  scene.background = texture;
});


  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.5, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  clock = new THREE.Clock();

  const loader = new GLTFLoader();

  loader.load(
    'fawn_a3.glb',
    (gltf) => {
      const model = gltf.scene;
      const modelWrapper = new THREE.Group();
      modelWrapper.rotation.x = Math.PI;
      gltf.scene.traverse((child) => {
        if (child.isBone && child.name === "bip001_head_011") {
          headBone = child;
        }
      });
      

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      modelWrapper.add(model);
      scene.add(modelWrapper);

      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
      });

      isModelLoaded = true;
      console.log('Loaded animations:', Object.keys(actions));
      
      if (actions["Fawn_A_Idle"]) {
        playAnimation('Fawn_A_Idle');
      }
    },
    undefined,
    (error) => console.error('Error loading model:', error)
  );

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
function updateSpeechBubblePosition() {
  if (!headBone || !speechBubbleVisible) return;

  const bubble = document.querySelector('.speech-bubble');
  if (!container || !bubble) return;

  const rect = container.getBoundingClientRect();

  const worldPos = new THREE.Vector3();
  headBone.getWorldPosition(worldPos);

  const screenPos = worldPos.project(camera);

  // Convert to container-relative screen coordinates
  const x = (screenPos.x + 1) / 2 * rect.width;
  const y = (-screenPos.y + 1) / 2 * rect.height;

  // Position bubble absolutely **inside** the container
  bubble.style.left = `${x}px`; // Now purely relative to container
  bubble.style.top = `${y - 60}px`; // Offset above the head
}



function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  updateSpeechBubblePosition(); // 💬 add this line

  controls.update();
  renderer.render(scene, camera);
}


export function triggerAnimation(sentiment) {
  if (!isModelLoaded) {
    console.log('Model not loaded yet');
    return;
  }

  const animationMap = {
    Excited: 'Fawn_A_Jump',
    Sad: 'Fawn_A_SitDown',
    neutral: 'Fawn_A_Idle',
    Calm:'Fawn_A_Walk',
    Hopeful:'Fawn_A_Swim',
    Anxious:'Fawn_A_Run',
    Fearful: 'Fawn_A_Atk'

  };

  const animationName = animationMap[sentiment] || 'Fawn_A_Idle';
  
  if (actions[animationName]) {
    playAnimation(animationName);
  } else {
    console.warn(`Animation ${animationName} not found`);
    if (actions['Fawn_A_Idle']) playAnimation('Fawn_A_Idle');
  }
}

function playAnimation(name) {
  if (currentAction === actions[name]) return;

  if (currentAction) {
    currentAction.fadeOut(0.5);
  }

  currentAction = actions[name]
    .reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(0.5)
    .play();
}

init();
animate();