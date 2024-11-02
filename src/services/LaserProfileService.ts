import { z } from 'zod';

export interface LaserProfile {
  name: string;
  type: 'fiber' | 'co2' | 'diode';
  power: number;
  wavelength: number;
  minPower: number;
  maxPower: number;
  focusHeight: number;
  beamDiameter: number;
  settings: {
    powerCurve: number[];
    speedCurve: number[];
    pulseFrequency: number;
    pulseWidth: number;
    assistGas?: {
      type: 'air' | 'nitrogen' | 'oxygen';
      pressure: number;
    };
    mopaSettings?: {
      pulseShapes: string[];
      burstMode: boolean;
      burstSpacing: number;
    };
  };
}

export interface MaterialProfile {
  name: string;
  type: string;
  thickness: number;
  settings: {
    power: number;
    speed: number;
    passes: number;
    zOffset: number;
    assistGas?: {
      type: 'air' | 'nitrogen' | 'oxygen';
      pressure: number;
    };
  };
}

const defaultProfiles: LaserProfile[] = [
  {
    name: "Seamann 50W Fiber",
    type: "fiber",
    power: 50,
    wavelength: 1064,
    minPower: 1,
    maxPower: 50,
    focusHeight: 0.12,
    beamDiameter: 0.05,
    settings: {
      powerCurve: Array.from({ length: 256 }, (_, i) => i / 255),
      speedCurve: Array.from({ length: 256 }, (_, i) => Math.pow(i / 255, 2)),
      pulseFrequency: 20000,
      pulseWidth: 0.05,
      assistGas: {
        type: "nitrogen",
        pressure: 8
      }
    }
  },
  {
    name: "Raycus 100W Fiber",
    type: "fiber",
    power: 100,
    wavelength: 1064,
    minPower: 1,
    maxPower: 100,
    focusHeight: 0.15,
    beamDiameter: 0.05,
    settings: {
      powerCurve: Array.from({ length: 256 }, (_, i) => i / 255),
      speedCurve: Array.from({ length: 256 }, (_, i) => Math.pow(i / 255, 2)),
      pulseFrequency: 30000,
      pulseWidth: 0.04,
      assistGas: {
        type: "nitrogen",
        pressure: 10
      }
    }
  },
  {
    name: "JPT 70W MOPA",
    type: "fiber",
    power: 70,
    wavelength: 1064,
    minPower: 1,
    maxPower: 70,
    focusHeight: 0.15,
    beamDiameter: 0.05,
    settings: {
      powerCurve: Array.from({ length: 256 }, (_, i) => i / 255),
      speedCurve: Array.from({ length: 256 }, (_, i) => Math.pow(i / 255, 2)),
      pulseFrequency: 50000,
      pulseWidth: 0.02,
      mopaSettings: {
        pulseShapes: ['0-25ns', '0-50ns', '0-200ns', '0-500ns'],
        burstMode: true,
        burstSpacing: 0.001
      },
      assistGas: {
        type: "nitrogen",
        pressure: 10
      }
    }
  },
  {
    name: "MaxPhotonics 120W MOPA",
    type: "fiber",
    power: 120,
    wavelength: 1064,
    minPower: 1,
    maxPower: 120,
    focusHeight: 0.18,
    beamDiameter: 0.05,
    settings: {
      powerCurve: Array.from({ length: 256 }, (_, i) => i / 255),
      speedCurve: Array.from({ length: 256 }, (_, i) => Math.pow(i / 255, 2)),
      pulseFrequency: 60000,
      pulseWidth: 0.02,
      mopaSettings: {
        pulseShapes: ['0-25ns', '0-50ns', '0-200ns', '0-500ns'],
        burstMode: true,
        burstSpacing: 0.001
      },
      assistGas: {
        type: "nitrogen",
        pressure: 12
      }
    }
  },
  {
    name: "IPG 150W Fiber",
    type: "fiber",
    power: 150,
    wavelength: 1064,
    minPower: 1,
    maxPower: 150,
    focusHeight: 0.2,
    beamDiameter: 0.05,
    settings: {
      powerCurve: Array.from({ length: 256 }, (_, i) => i / 255),
      speedCurve: Array.from({ length: 256 }, (_, i) => Math.pow(i / 255, 2)),
      pulseFrequency: 50000,
      pulseWidth: 0.03,
      assistGas: {
        type: "nitrogen",
        pressure: 15
      }
    }
  },
  {
    name: "nLight 200W Fiber",
    type: "fiber",
    power: 200,
    wavelength: 1064,
    minPower: 1,
    maxPower: 200,
    focusHeight: 0.25,
    beamDiameter: 0.05,
    settings: {
      powerCurve: Array.from({ length: 256 }, (_, i) => i / 255),
      speedCurve: Array.from({ length: 256 }, (_, i) => Math.pow(i / 255, 2)),
      pulseFrequency: 70000,
      pulseWidth: 0.02,
      assistGas: {
        type: "nitrogen",
        pressure: 18
      }
    }
  }
];

export class LaserProfileService {
  private profiles: Map<string, LaserProfile> = new Map();
  private materialProfiles: Map<string, MaterialProfile[]> = new Map();

  constructor() {
    defaultProfiles.forEach(profile => {
      this.profiles.set(profile.name, profile);
    });
  }

  getProfile(name: string): LaserProfile | undefined {
    return this.profiles.get(name);
  }

  calculatePowerForGrayscale(
    profile: LaserProfile,
    grayscaleValue: number,
    options: {
      contrast: number;
      brightness: number;
      gamma: number;
      minPower: number;
      maxPower: number;
    }
  ): number {
    // Apply image adjustments
    let adjusted = grayscaleValue;
    adjusted = Math.pow(adjusted, 1 / options.gamma); // Gamma correction
    adjusted = adjusted * options.contrast + options.brightness; // Contrast and brightness
    adjusted = Math.max(0, Math.min(1, adjusted)); // Clamp to [0,1]

    // Map to power curve
    const powerIndex = Math.floor(adjusted * (profile.settings.powerCurve.length - 1));
    const powerPercentage = profile.settings.powerCurve[powerIndex];

    // Scale to power range
    return options.minPower + (options.maxPower - options.minPower) * powerPercentage;
  }

  calculateDepthFromHeightmap(
    heightValue: number,
    maxDepth: number,
    options: {
      levels: number;
      curve: 'linear' | 'exponential' | 'logarithmic';
      invert: boolean;
    }
  ): number {
    let depth = heightValue;
    
    if (options.invert) {
      depth = 1 - depth;
    }

    switch (options.curve) {
      case 'exponential':
        depth = Math.pow(depth, 2);
        break;
      case 'logarithmic':
        depth = Math.log(depth * (Math.E - 1) + 1);
        break;
    }

    if (options.levels > 1) {
      depth = Math.round(depth * (options.levels - 1)) / (options.levels - 1);
    }

    return depth * maxDepth;
  }

  generatePowerMap(
    heightmap: number[][],
    profile: LaserProfile,
    options: {
      maxDepth: number;
      passes: number;
      baseSpeed: number;
      depthPerPass: number;
      powerAdjustment: number;
    }
  ): Array<{
    passNumber: number;
    powerMap: number[][];
    speed: number;
    zOffset: number;
  }> {
    const passes: Array<{
      passNumber: number;
      powerMap: number[][];
      speed: number;
      zOffset: number;
    }> = [];

    const maxPasses = Math.ceil(options.maxDepth / options.depthPerPass);
    const actualPasses = Math.min(maxPasses, options.passes);

    for (let pass = 0; pass < actualPasses; pass++) {
      const powerMap: number[][] = [];
      const targetDepth = (pass + 1) * options.depthPerPass;

      for (let y = 0; y < heightmap.length; y++) {
        const row: number[] = [];
        for (let x = 0; x < heightmap[y].length; x++) {
          const heightValue = heightmap[y][x];
          const requiredDepth = heightValue * options.maxDepth;

          if (requiredDepth > targetDepth - options.depthPerPass) {
            const powerPercentage = Math.min(
              1,
              (requiredDepth - (targetDepth - options.depthPerPass)) / options.depthPerPass
            );
            row.push(powerPercentage * profile.maxPower * options.powerAdjustment);
          } else {
            row.push(0);
          }
        }
        powerMap.push(row);
      }

      passes.push({
        passNumber: pass + 1,
        powerMap,
        speed: options.baseSpeed * Math.pow(0.9, pass), // Reduce speed for deeper passes
        zOffset: -targetDepth
      });
    }

    return passes;
  }

  optimizeLaserPath(
    powerMap: number[][],
    options: {
      direction: 'bidirectional' | 'unidirectional';
      angle: number;
      lineSpacing: number;
      crosshatch: boolean;
    }
  ): Array<{
    x: number;
    y: number;
    power: number;
  }> {
    // Implementation for optimized laser path generation
    // This would include advanced path optimization algorithms
    return [];
  }

  calculateFocalAdjustment(
    depth: number,
    material: {
      refractiveIndex: number;
      thickness: number;
    }
  ): number {
    // Calculate focal point adjustment based on material properties
    const focalShift = depth * (1 - 1 / material.refractiveIndex);
    return focalShift;
  }
}