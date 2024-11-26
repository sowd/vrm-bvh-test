import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';
import { VRM } from '@pixiv/three-vrm';

// シーン、カメラ、レンダラーの設定
const canvas = document.getElementById('vrmCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 環境光
const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// VRMとBVHの読み込み
let vrmModel;
let skeletonHelper;
const clock = new THREE.Clock();

const loadVRM = (url) => {
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    VRM.from(gltf).then((vrm) => {
      vrmModel = vrm;
      scene.add(vrm.scene);
      vrm.scene.rotation.y = Math.PI; // VRMモデルの向きを修正
    });
  });
};

const loadBVH = (url) => {
  const loader = new BVHLoader();
  loader.load(url, (result) => {
    skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
    skeletonHelper.skeleton = result.skeleton; // BVHスケルトンの設定

    // VRMモデルにBVHのアニメーションを適用
    if (vrmModel) {
      applyBVHToVRM(vrmModel, skeletonHelper);
    }
  });
};

const applyBVHToVRM = (vrm, bvhSkeleton) => {
  const vrmHumanBones = vrm.humanoid?.humanBones;
  if (!vrmHumanBones) {
    console.error('VRMモデルにヒューマノイドボーンが設定されていません。');
    return;
  }

  const map = new Map();
  bvhSkeleton.skeleton.bones.forEach((bone) => {
    map.set(bone.name.toLowerCase(), bone);
  });

  for (const [boneName, vrmBone] of Object.entries(vrmHumanBones)) {
    const bvhBone = map.get(boneName.toLowerCase());
    if (bvhBone && vrmBone) {
      // BVHボーンをVRMボーンに紐付け
      vrmBone.node.traverse((child) => {
        if (child.isBone) {
          child.add(bvhBone);
        }
      });
    }
  }
};

// アニメーションループ
const animate = () => {
  requestAnimationFrame(animate);

  if (vrmModel) {
    const delta = clock.getDelta();
    vrmModel.update(delta); // VRMモデルの更新
  }

  renderer.render(scene, camera);
};

// モデルとBVHを読み込む
loadVRM('AAA.vrm'); // VRMファイルのパス
loadBVH('MCPM.BVH'); // BVHファイルのパス

animate();
