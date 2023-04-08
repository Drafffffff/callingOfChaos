import "./index.css";
import { onCleanup, onMount } from "solid-js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import ScrambleText from "scramble-text";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import studio from "@theatre/studio";
import { getProject, types } from "@theatre/core";
import projectState from "./coc.theatre-project-state.json"

//a map function like p5
const map = (value, start1, stop1, start2, stop2) => {
  return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

export default function Home() {
  let title = null;
  let camera, scene, renderer;
  let threeContainer = null;
  const textureLoader = new THREE.TextureLoader();
  const project = getProject("coc",{state:projectState});
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
    //theatre anime
    const cameraAnime = sheet.object("camera", {
      position: types.compound({
        x: types.number(camera.position.x, { min: -10, max: 10 }),
        y: types.number(camera.position.y, { min: -10, max: 10 }),
        z: types.number(camera.position.z, { min: -10, max: 10 }),
      }),
    });
    cameraAnime.onValuesChange((v) => {
      camera.position.x = v.position.x;
      camera.position.y = v.position.y;
      camera.position.z = v.position.z;
    });
    camera.lookAt(0, 0, 0);
    const texture = textureLoader.load("matcap/1.png");
    const loader = new GLTFLoader().setPath("model/");
    loader.load("scene.gltf", function (gltf) {
      const cylinder = gltf.scene.children[0].children.find((child) => {
        return child.name === "Cylinder";
      });
      const cylinder002 = gltf.scene.children[0].children.find((child) => {
        return child.name === "Cylinder002";
      });
      const cylinder001 = gltf.scene.children[0].children.find((child) => {
        return child.name === "Cylinder001";
      });
      console.log(cylinder);
      const cylinderMaterial = new THREE.MeshMatcapMaterial({
        matcap: texture,
        transparent: true,
        opacity: 0.5,
      });
      cylinder.material = cylinderMaterial;
      cylinder002.material = cylinderMaterial;
      cylinder001.material = cylinderMaterial;
      scene.add(gltf.scene);
    });
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    threeContainer.appendChild(renderer.domElement);
  }
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  onMount(() => {
    if (import.meta.env.DEV) {
      studio.initialize();
    }
    threeInit();
    new ScrambleText(title, scrambConfig).start();
    window.addEventListener("resize", onWindowResize, false);
    animate();
    ScrollTrigger.create({
      trigger: "html",
      start: "top top",
      end: "bottom bottom",
      // markers: true,
      onUpdate: (self) => {
        // console.log(self.progress);
        sheet.sequence.position = map(self.progress, 0, 1, 0, 4);
      },
    });
  });

  onCleanup(() => {
    ScrollTrigger.getAll().forEach((trigger) => {
      trigger.kill();
    });
  });
  return (
    <div class="main">
      <div className="threescene " ref={threeContainer}></div>
      <div class="scroll">
        <div class="section title px-8 py-4">
          <div class="nav">
            <img src="LOGO-w.svg" />
          </div>
          <div class="container">
            <img class="h-20 m-auto" src="LOGO-g.svg" />
            <h1 class="scramble text-[5rem] mt-6" ref={title}>
              「混沌召唤」
            </h1>
            <h2 class="scramble text-[4rem] tracking-widest">元宇宙潮流品牌</h2>
            <h2 class="scramble text-[3rem] title-en">Calling of Chaos</h2>
          </div>
        </div>
        <div class="section moto">
          <div class="container">
            <p>
              CØC将是<em>「创世神」</em>的诞生之地
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
        <div class="section">
          <div className="container">
            <img src="LOGO-w.svg" class="h-12 mx-auto" />
            <p class="text-5xl mt-10">「创造你的数字时尚」</p>
          </div>
        </div>
        <div class="section">
          <h1>召唤器</h1>
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
            <img src="LOGO-w.svg" class="h-8" />
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
