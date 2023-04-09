import "./index.css";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrambleText from "scramble-text";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { SSRPass } from "three/addons/postprocessing/SSRPass.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";
import studio from "@theatre/studio";
import { getProject, types } from "@theatre/core";
import projectState from "./coc.theatre-project-state.json";
import ScrambleTextPlugin from "gsap/ScrambleTextPlugin";
gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

//a map function like p5
const map = (value, start1, stop1, start2, stop2) => {
  return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

export default function Home() {
  const [mousePos, setMousePos] = createSignal({ x: 0, y: 0 });
  function onMouseMove(e) {
    setMousePos({ x: e.clientX, y: e.clientY });
  }
  const width = window.innerWidth || 2;
  const height = window.innerHeight || 2;
  let title = null;
  let camera,
    machineGroup,
    scene,
    renderer,
    composer,
    ssrPass,
    cocShell,
    cocLogo,
    cocScreen;

  let whitePointLight, greenPointLight;
  let threeContainer = null;
  const textureLoader = new THREE.TextureLoader();
  const project = getProject("coc", { state: projectState });
  const sheet = project.sheet("coc");
  const scrambConfig = {
    timeOffset: 200,
    chars: ["@", "#", "/", "?", ".", "&", "^", "%"],
  };
  function threeInit() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.y = 9;
    //add whitePointLight
    whitePointLight = new THREE.PointLight(0xffffff, 20);
    // whitePointLight.distance = 2000;
    whitePointLight.position.set(1, 0, 1);
    scene.add(whitePointLight);
    //add greenPointLight
    greenPointLight = new THREE.PointLight(0x00ff00, 50);
    greenPointLight.position.set(1, 0, -1);
    // greenPointLight.distance = 2000;
    scene.add(greenPointLight);
    const cylinderPhysical = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, // 基础颜色为黑色
      metalness: 1, // 金属度为1，表示完全是金属
      roughness: 0.1, // 粗糙度为0，表示非常光滑
    });
    camera.lookAt(0, -50, 0);
    const spherePhysical = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    // spherePhysical.emissiveIntensity = 0.5;
    const cocShellMatCap = textureLoader.load("/matcap/5.png");
    const cocMaterial = new THREE.MeshMatcapMaterial({
      matcap: cocShellMatCap,
    });
    //add video texture
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = "/texture/coc.mp4";
    video.loop = true;
    video.muted = true;
    video.play();
    const videoTexture = new THREE.VideoTexture(video);
    // videoTexture.minFilter = THREE.LinearFilter;
    // videoTexture.magFilter = THREE.LinearFilter;
    // videoTexture.format = THREE.RGBFormat;
    const videoMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
    });

    const loader = new GLTFLoader().setPath("/model/");
    loader.load("scene.gltf", function (gltf) {
      const cylinder = gltf.scene.children.find((child) => {
        return child.name === "Cylinder";
      });
      cylinder.material = cylinderPhysical;
      scene.add(gltf.scene);
    });

    machineGroup = new THREE.Group();
    const coc = loader.load("coc.gltf", function (gltf) {
      console.log(gltf.scene.children);
      cocShell = gltf.scene.children.find((child) => {
        return child.name === "machine_outershell";
      });
      cocShell.material = cocMaterial;
      cocScreen = gltf.scene.children.find((child) => {
        return child.name === "machine_screen";
      });
      cocLogo = gltf.scene.children.find((child) => {
        return child.name === "machine_outshell_coc";
      });
      //add to machineGroup
      cocScreen.material = videoMaterial;
      machineGroup.add(cocShell);
      machineGroup.add(cocScreen);
      machineGroup.add(cocLogo);
      scene.add(machineGroup);
    });

    console.log(coc);

    renderer = new THREE.WebGLRenderer();
    // renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    threeContainer.appendChild(renderer.domElement);
    // composer
    composer = new EffectComposer(renderer);
    ssrPass = new SSRPass({
      renderer,
      scene,
      camera,
      width: innerWidth,
      height: innerHeight,
    });
    const glitchPass = new GlitchPass();
    composer.addPass(ssrPass);
    // composer.addPass(glitchPass);
    //theatre anime
    const cameraAnime = sheet.object("camera", {
      position: types.compound({
        x: types.number(camera.position.x, { min: -10, max: 10 }),
        y: types.number(camera.position.y, { min: -10, max: 10 }),
        z: types.number(camera.position.z, { min: -10, max: 10 }),
      }),
      caveRoughness: types.number(0.1, { range: [0, 1] }),
      pixelate: types.number(6, { range: [1, 30] }),
      cocPosition: types.compound({
        x: types.number(0, { range: [-40, 10] }),
        y: types.number(0, { range: [-40, 10] }),
        z: types.number(0, { range: [-40, 10] }),
      }),
      cocRotation: types.compound({
        x: types.number(0.1, { range: [-10, 10] }),
        y: types.number(0.1, { range: [-10, 10] }),
        z: types.number(0.1, { range: [-10, 10] }),
      }),
      cocScale: types.number(1, { range: [0, 1] }),
    });
    cameraAnime.onValuesChange((v) => {
      camera.position.x = v.position.x;
      camera.position.y = v.position.y;
      camera.position.z = v.position.z;
      cylinderPhysical.roughness = v.caveRoughness;
      if (cocShell) {
        cocShell.position.x = v.cocPosition.x / 10;
        cocShell.position.y = v.cocPosition.y;
        cocShell.position.z = v.cocPosition.z / 10;
        cocShell.rotation.set(
          v.cocRotation.x * Math.PI,
          v.cocRotation.y * Math.PI,
          v.cocRotation.z * Math.PI
        );
        cocShell.scale.x = v.cocScale;
        cocShell.scale.y = v.cocScale;
        cocShell.scale.z = v.cocScale;
        cocLogo.position.x = v.cocPosition.x / 10;
        cocLogo.position.y = v.cocPosition.y;
        cocLogo.position.z = v.cocPosition.z / 10;
        cocLogo.rotation.set(
          v.cocRotation.x * Math.PI,
          v.cocRotation.y * Math.PI,
          v.cocRotation.z * Math.PI
        );
        cocLogo.scale.x = v.cocScale;
        cocLogo.scale.y = v.cocScale;
        cocLogo.scale.z = v.cocScale;
        cocScreen.position.x = v.cocPosition.x / 10;
        cocScreen.position.y = v.cocPosition.y;
        cocScreen.position.z = v.cocPosition.z / 10;
        cocScreen.rotation.set(
          v.cocRotation.x * Math.PI,
          v.cocRotation.y * Math.PI,
          v.cocRotation.z * Math.PI
        );
        cocScreen.scale.x = v.cocScale;
        cocScreen.scale.y = v.cocScale;
        cocScreen.scale.z = v.cocScale;
      }
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    // composer.render(scene, camera);
    whitePointLight.position.y = camera.position.y - 10;
    greenPointLight.position.y = camera.position.y - 10;
    whitePointLight.position.x = map(
      mousePos().x,
      0,
      window.innerWidth,
      -10,
      10
    );
    whitePointLight.position.z = map(
      mousePos().y,
      0,
      window.innerHeight,
      -10,
      10
    );
    greenPointLight.position.x = map(
      mousePos().x,
      0,
      window.innerWidth,
      -10,
      10
    );
    greenPointLight.position.z = map(
      mousePos().y,
      0,
      window.innerHeight,
      -10,
      10
    );
    composer.render(scene, camera);
  }
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  let timmer = null;
  //binding poniteLigte x z pos to mousepos
  onMount(() => {
    if (import.meta.env.DEV) {
      studio.initialize();
    }
    threeInit();
    new ScrambleText(title, scrambConfig).start();
    // timmer = setInterval(() => {
    //   new ScrambleText(title, scrambConfig).start();
    // }, 3000);
    window.addEventListener("resize", onWindowResize, false);
    animate();
    //total scroll
    ScrollTrigger.create({
      trigger: "#root",
      start: "top top",
      end: `bottom bottom`,
      scrub: 1,
      // markers: true,
      onUpdate: (self) => {
        sheet.sequence.position = map(self.progress, 0, 1, 0, 4);
      },
    });

    //moto scrolltrigger
    ScrollTrigger.create({
      trigger: ".moto",
      start: "top center-=300px",
      end: "bottom bottom",
      // markers: true,
      pin: true,
      pinSpacing: false,
    });
    //fashion scrolltrigger
    ScrollTrigger.create({
      trigger: ".fashion",
      start: "top center-=100px",
      end: "bottom bottom",
      // markers: true,
      pin: true,
      pinSpacing: false,
    });
    ScrollTrigger.create({
      trigger: ".machine",
      start: "top center-=200px",
      end: "bottom bottom",
      // markers: true,
      pin: true,
      pinSpacing: false,
    });
  });

  onCleanup(() => {
    clearInterval(timmer);
    ScrollTrigger.getAll().forEach((trigger) => {
      trigger.kill();
    });
  });
  return (
    <div class="main" onMouseMove={onMouseMove}>
      <div className="threescene " ref={threeContainer}></div>
      <div class="scroll">
        <div class="section title px-8 py-4">
          <div class="nav">
            <img src="/LOGO-w.svg" />
          </div>
          <div class="container">
            <img class="h-14 lg:h-20 m-auto" src="LOGO-g.svg" />
            <h1
              class="scramble mb-3  text-[2rem] lg:text-[5rem] mt-6"
              ref={title}
            >
              「混沌召唤」
            </h1>
            <h2 class="scramble text-[1rem] lg:text-[4rem]  ">
              元宇宙潮流品牌
            </h2>
            <h2 class="scramble text-[1rem] lg:text-[3rem] title-en title-en">
              Calling Øf Chaos
            </h2>
          </div>
        </div>
        <div class="section moto">
          <div class="container">
            <p>
              CØC将是<em id="strong">「创世神」</em>的诞生之地
            </p>
            <p>这里聚合了最具创造力的人类.</p>
            <p>创造，是我的底层基因。</p>
            <p>我们都有着狂野不羁的一面,</p>
            <p>因为我对创造力有着披致渴望.</p>
            <p>当我打破当前的范，我开始发出唤。</p>
            <p>寻求一种与新时代需求产生共脚鸣时方式，</p>
            <p>对人类时精神文化进行重建。</p>
            <p>让态度从"发声”，到真正的“发生”。</p>
            <p class="scramble mt-8">
              <em>「我们皆是造物主」</em>
            </p>
          </div>
        </div>
        <div class="section fashion">
          <div className="container">
            <img src="/LOGO-w.svg" class="h-10 lg:h-12 mx-auto" />
            <p class="text-3xl lg:text-5xl mt-10">「创造你的数字时尚」</p>
          </div>
        </div>
        <div class="section machine">
          <div class="container">
            <div className="left"></div>
            <div className="right">
              <div className="content">
                <em>CØC混沌召唤</em>
                <br />
                <br />
                Calling Øf Chaos
                <br />
                由创造者主导的数字潮流组织，CØC使用最新的游戏引擎、NFT、区块链认证和XR拓展现实等技术，铸造连接虚拟现实的数字潮流产品矩阵和艺术品，创造Z时代的数字潮流生态。
              </div>
            </div>
          </div>
        </div>
        <div class="section force">
          <div class="container">
            <div class="creation item">
              <img src="creation.svg" class="icon" />
              <div className="text">
                <div className="title">
                  <h1>「创造力」</h1>
                </div>
                <div className="info">
                  我们的品牌价值直截了当，我们创造性地重新思考，打破传统，颠覆未来
                </div>
              </div>
            </div>
            <div class="coop item">
              <img src="coop.svg" class="icon" />
              <div className="text">
                <div className="title">
                  <h1>「合作力」</h1>
                </div>
                <div className="info">
                  我们致力于创作者DAO组织建设，对跨界合作共同创造新事物感到兴奋
                </div>
              </div>
            </div>
            <div class="var item">
              <img src="var.svg" class="icon" />
              <div className="text">
                <div className="title">
                  <h1>「多样性」</h1>
                </div>
                <div className="info">
                  我们的团队和社区将个性视为一种力量，并尽可能寻求多样性
                </div>
              </div>
            </div>
            <div class="inno item">
              <img src="inno.svg" class="icon" />
              <div className="text">
                <div className="title">
                  <h1>「创新性」</h1>
                </div>
                <div className="info">
                  我们运用专业性和创造力，创造最大化跨界文化的影响力
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer">
          <div class="info logo">
            <img src="/LOGO-w.svg" class="h-8" />
          </div>
          <div class="info followUs text-3xl">Follow Us</div>
          <div class="info">
            <img src="twitter.svg" />
            <div class="ml-3">
              <a href="https://twitter.com/CallingOfChaos">@CallingOfChaos</a>
            </div>
          </div>

          <div class="info">
            <img src="email.svg" />
            <div class="ml-3">
              <a href="calllingofchaos@coc.space">@CallingOfChaos</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
