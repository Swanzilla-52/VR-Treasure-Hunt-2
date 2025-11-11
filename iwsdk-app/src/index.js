import {
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  EnvironmentType,
  LocomotionEnvironment,
  SessionMode,
  World,
  AssetType,
  AssetManager,
  DirectionalLight,
  AmbientLight,
  SphereGeometry,
  CanvasTexture,
} from '@iwsdk/core';

import {
  Interactable,
  PanelUI,
  ScreenSpace
} from '@iwsdk/core';

import { PanelSystem } from './panel.js'; // system for displaying "Enter VR" panel on Quest 1
const assets = {
  oakTree: {
    url: '/gltf/Tree/oak_tree.glb',
    type: AssetType.GLTF,
    priority: 'critical',
  },
};

World.create(document.getElementById('scene-container'), {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always',
    features: {}
  },

  features: {
    locomotion: {
      smooth: true,
      teleport: true,
      speed: 1.5,
      teleportDistance: 2.5,
    },
  },

}).then((world) => {

  const { camera } = world;

  // --- GROUND ---
  const groundGeometry = new PlaneGeometry(40, 40);
  const groundMaterial = new MeshStandardMaterial({ color: 0x2b7a0b });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const groundEntity = world.createTransformEntity(ground);
  groundEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  // --- Lighting ---
  //const sun = new DirectionalLight(0xffffff, 2.0);
  //sun.position.set(10, 12, 10);
  //sun.castShadow = true;
  //scene.add(sun);

  //const ambient = new AmbientLight(0xffffff, 0.8);
  //scene.add(ambient);

  // --- TREES ---
  const treeModel = AssetManager.getGLTF('oakTree').scene;
  treeModel.castShadow = true;
  treeModel.receiveShadow = true;

  const spacing = 8;
  const gridSize = 30;
  const half = gridSize / 2;
  for (let x = -half; x <= half; x += spacing) {
    for (let z = -half; z <= half; z += spacing) {
      const tree = treeModel.clone(true);
      tree.position.set(x, -0.2, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      world.createTransformEntity(tree);
    }
  }

  // --- Spheres ---
  const sphereGeometry = new SphereGeometry(0.5, 32, 32);
  const sphereMaterial = new MeshStandardMaterial({
  color: 0xffd700,
  metalness: 0.8,
  roughness: 0.2,
  emissive: 0x332200,
  emissiveIntensity: 0.3,
});

let collected = 0;

function handleCollect(entity) {
  entity.destroy();
  collected++;
  if (collected === 3) showWinMessage();
}

function createSphere(x, y, z) {
  const sphere = new Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(x, y, z);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  const entity = world.createTransformEntity(sphere);
  entity.addComponent(Interactable);
  entity.object3D.addEventListener("pointerdown", () => handleCollect(entity));
  return entity;
}

createSphere(3, 0.5, -5);
createSphere(-5, 0.5, 8);
createSphere(10, 0.5, -8);

// --- Canvas Message ---
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 256;

const texture = new CanvasTexture(canvas);
const messagePlane = new Mesh(
  new PlaneGeometry(10, 2.5),
  new MeshStandardMaterial({ map: texture, transparent: true })
);
messagePlane.position.set(0, 2, -4);

const messageEntity = world.createTransformEntity(messagePlane);

function drawMessage(text, color = '#ffffffff', fontSize = 80) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, 160);
  texture.needsUpdate = true;
}

drawMessage('Find all the golden spheres!');

function showWinMessage() {
  drawMessage('YOU WIN!', '#ffffffff', 120);
}











// vvvvvvvv EVERYTHING BELOW WAS ADDED TO DISPLAY A BUTTON TO ENTER VR FOR QUEST 1 DEVICES vvvvvv
//          (for some reason IWSDK doesn't show Enter VR button on Quest 1)
world.registerSystem(PanelSystem);

if (isMetaQuest1()) {
  const panelEntity = world
    .createTransformEntity()
    .addComponent(PanelUI, {
      config: '/ui/welcome.json',
      maxHeight: 0.8,
      maxWidth: 1.6
    })
    .addComponent(Interactable)
    .addComponent(ScreenSpace, {
      top: '20px',
      left: '20px',
      height: '40%'
    });
  panelEntity.object3D.position.set(0, 1.29, -1.9);
} else {
  // Skip panel on non-Meta-Quest-1 devices
  // Useful for debugging on desktop or newer headsets.
  console.log('Panel UI skipped: not running on Meta Quest 1 (heuristic).');
}
function isMetaQuest1() {
  try {
    const ua = (navigator && (navigator.userAgent || '')) || '';
    const hasOculus = /Oculus|Quest|Meta Quest/i.test(ua);
    const isQuest2or3 = /Quest\s?2|Quest\s?3|Quest2|Quest3|MetaQuest2|Meta Quest 2/i.test(ua);
    return hasOculus && !isQuest2or3;
  } catch (e) {
    return false;
  }
}

});
