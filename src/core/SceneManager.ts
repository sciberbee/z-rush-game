import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // Initialize Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(GameConfig.COLOR_SKY);
    this.scene.fog = new THREE.Fog(GameConfig.COLOR_SKY, 50, 150);

    // Initialize Camera
    this.camera = new THREE.PerspectiveCamera(
      GameConfig.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, GameConfig.CAMERA_HEIGHT, -GameConfig.CAMERA_DISTANCE);
    this.camera.lookAt(0, 0, GameConfig.CAMERA_LOOK_AHEAD);

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, GameConfig.MAX_PIXEL_RATIO));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupEnvironment();
    this.setupResizeHandler();
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = GameConfig.SHADOW_MAP_SIZE;
    directionalLight.shadow.mapSize.height = GameConfig.SHADOW_MAP_SIZE;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    this.scene.add(directionalLight);

    // Hemisphere light for better ambient
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2d5a27, 0.3);
    this.scene.add(hemisphereLight);
  }

  private setupEnvironment(): void {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: GameConfig.COLOR_GROUND,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = 200;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Side walls (visual boundaries)
    const wallGeometry = new THREE.BoxGeometry(1, 3, 500);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-GameConfig.HORIZONTAL_LIMIT - 1, 1.5, 200);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(GameConfig.HORIZONTAL_LIMIT + 1, 1.5, 200);
    this.scene.add(rightWall);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public updateCamera(targetZ: number): void {
    this.camera.position.z = targetZ - GameConfig.CAMERA_DISTANCE;
    this.camera.lookAt(0, 0, targetZ + GameConfig.CAMERA_LOOK_AHEAD);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
