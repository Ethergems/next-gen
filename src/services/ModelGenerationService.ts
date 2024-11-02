import { DeepAI } from 'deepai';
import { HfInference } from '@huggingface/inference';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect';

export class ModelGenerationService {
  private deepai: DeepAI;
  private hf: HfInference;
  private composer: EffectComposer;
  private anaglyphEffect: AnaglyphEffect;

  constructor() {
    this.deepai = new DeepAI({ apiKey: process.env.DEEP_AI_API_KEY });
    this.hf = new HfInference(process.env.HUGGING_FACE_API_KEY);
  }

  async generateModelFromImage(imageData: string, enhancementLevel: 'standard' | 'extreme' = 'extreme'): Promise<ArrayBuffer> {
    try {
      // Generate depth map using DeepAI
      const depthResponse = await this.deepai.callStandardApi("deepdream", {
        image: imageData,
        enhance_level: enhancementLevel === 'extreme' ? 2 : 1
      });

      // Generate normal map for enhanced depth
      const normalMap = await this.generateNormalMap(depthResponse.output_url);

      // Convert depth and normal maps to enhanced 3D mesh
      const geometry = await this.depthMapToGeometry(depthResponse.output_url, normalMap);
      
      // Add particle system for depth enhancement
      const particleSystem = this.createParticleSystem(geometry);
      
      // Export as enhanced GLTF
      return await this.exportToGLTF(geometry, particleSystem);
    } catch (error) {
      throw new Error(`Model generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateModelFromText(text: string): Promise<ArrayBuffer> {
    try {
      // Use HuggingFace for enhanced text-to-3D generation
      const response = await this.hf.textToImage({
        inputs: text,
        model: "stabilityai/stable-diffusion-2-1",
        parameters: {
          negative_prompt: "blurry, bad quality, distorted, flat, 2D",
          positive_prompt: "highly detailed, 3D, depth, volumetric, stereoscopic",
          num_inference_steps: 100,
          guidance_scale: 9.5
        }
      });

      // Convert to enhanced 3D model
      return await this.generateModelFromImage(
        await response.blob().then(b => URL.createObjectURL(b)),
        'extreme'
      );
    } catch (error) {
      throw new Error(`Text-to-3D generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateNormalMap(depthMapUrl: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(depthMapUrl, (texture) => {
        const normalMap = new THREE.WebGLRenderTarget(
          texture.image.width,
          texture.image.height
        );
        
        // Generate normal map from depth
        const normalMaterial = new THREE.MeshNormalMaterial();
        const quad = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          normalMaterial
        );
        
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer();
        
        scene.add(quad);
        renderer.setRenderTarget(normalMap);
        renderer.render(scene, camera);
        
        resolve(normalMap.texture);
      }, undefined, reject);
    });
  }

  private async depthMapToGeometry(depthMapUrl: string, normalMap: THREE.Texture): Promise<THREE.BufferGeometry> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Create enhanced geometry with subdivisions
        const geometry = new THREE.PlaneGeometry(
          1, 1,
          img.width - 1, img.height - 1
        );
        
        const positions = geometry.attributes.position.array;
        const uvs = geometry.attributes.uv.array;
        
        // Enhanced depth calculation with normal mapping
        for (let i = 0; i < positions.length; i += 3) {
          const index = i / 3 * 4;
          const depth = imageData.data[index] / 255;
          
          // Apply enhanced depth mapping
          positions[i + 2] = depth * 0.2; // Increased depth range
          
          // Add geometric detail based on normal map
          const u = uvs[(i / 3) * 2];
          const v = uvs[(i / 3) * 2 + 1];
          const normal = this.sampleNormalMap(normalMap, u, v);
          
          positions[i] += normal.x * 0.05;
          positions[i + 1] += normal.y * 0.05;
          positions[i + 2] += normal.z * 0.05;
        }

        geometry.computeVertexNormals();
        resolve(geometry);
      };
      img.onerror = () => reject(new Error('Failed to load depth map'));
      img.src = depthMapUrl;
    });
  }

  private createParticleSystem(geometry: THREE.BufferGeometry): THREE.Points {
    const particleCount = 10000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const vertices = geometry.attributes.position.array;
    const vertexCount = vertices.length / 3;
    
    for (let i = 0; i < particleCount; i++) {
      // Sample vertex position
      const vertexIndex = Math.floor(Math.random() * vertexCount) * 3;
      
      positions[i * 3] = vertices[vertexIndex] + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = vertices[vertexIndex + 1] + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = vertices[vertexIndex + 2] + (Math.random() - 0.5) * 0.1;
      
      // Generate color based on depth
      const depth = vertices[vertexIndex + 2];
      colors[i * 3] = 0.5 + depth;
      colors[i * 3 + 1] = 0.8 + depth * 0.2;
      colors[i * 3 + 2] = 1.0;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.005,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(particleGeometry, particleMaterial);
  }

  private sampleNormalMap(normalMap: THREE.Texture, u: number, v: number): THREE.Vector3 {
    const width = normalMap.image.width;
    const height = normalMap.image.height;
    
    const x = Math.floor(u * width);
    const y = Math.floor(v * height);
    
    const pixel = new Uint8Array(4);
    const renderer = new THREE.WebGLRenderer();
    renderer.readRenderTargetPixels(
      normalMap as any,
      x, y, 1, 1,
      pixel
    );
    
    return new THREE.Vector3(
      (pixel[0] / 255) * 2 - 1,
      (pixel[1] / 255) * 2 - 1,
      (pixel[2] / 255)
    );
  }

  private async exportToGLTF(geometry: THREE.BufferGeometry, particles: THREE.Points): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const scene = new THREE.Scene();
      
      // Add main mesh with enhanced materials
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshPhysicalMaterial({ 
          metalness: 0.8,
          roughness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.2,
          envMapIntensity: 2.0,
          normalScale: new THREE.Vector2(2.0, 2.0)
        })
      );
      
      scene.add(mesh);
      scene.add(particles);
      
      // Add post-processing effects
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 2;
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      
      // Setup effect composer
      this.composer = new EffectComposer(renderer);
      this.composer.addPass(new RenderPass(scene, camera));
      this.composer.addPass(new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, 0.4, 0.85
      ));
      
      // Setup anaglyph effect
      this.anaglyphEffect = new AnaglyphEffect(renderer);
      this.anaglyphEffect.setSize(window.innerWidth, window.innerHeight);
      
      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            resolve(gltf);
          } else {
            reject(new Error('Failed to export GLTF'));
          }
        },
        (error) => reject(error),
        { 
          binary: true,
          animations: [],
          onlyVisible: true,
          maxTextureSize: 4096,
          forceIndices: true,
          includeCustomExtensions: true
        }
      );
    });
  }
}