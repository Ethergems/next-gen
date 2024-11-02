import { z } from 'zod';
import { LaserProfile, MaterialProfile } from './LaserProfileService';

export interface PrinterProfile {
  name: string;
  type: 'SLA' | 'FDM' | 'DLP' | 'MSLA';
  manufacturer: string;
  buildVolume: {
    x: number;
    y: number;
    z: number;
  };
  resolution: {
    xy: number;
    z: number;
  };
  settings: Record<string, any>;
}

export class ProfileManagerService {
  private static instance: ProfileManagerService;
  private printerProfiles: Map<string, PrinterProfile> = new Map();
  private laserProfiles: Map<string, LaserProfile> = new Map();
  private materialProfiles: Map<string, MaterialProfile[]> = new Map();

  private constructor() {
    this.initializeDefaultProfiles();
  }

  static getInstance(): ProfileManagerService {
    if (!ProfileManagerService.instance) {
      ProfileManagerService.instance = new ProfileManagerService();
    }
    return ProfileManagerService.instance;
  }

  private initializeDefaultProfiles() {
    // Proton SLA Printers
    this.addPrinterProfile({
      name: "Anycubic Photon Mono X 6K",
      type: "MSLA",
      manufacturer: "Anycubic",
      buildVolume: { x: 197, y: 122, z: 245 },
      resolution: { xy: 0.034, z: 0.01 },
      settings: {
        screenResolution: { x: 5760, y: 3600 },
        lightSource: "Mono LCD",
        wavelength: 405,
        normalExposure: 2.5,
        baseExposure: 30,
        baseLayers: 6,
        liftDistance: 6,
        liftSpeed: 180,
        retractSpeed: 240,
        antiAliasing: 4
      }
    });

    this.addPrinterProfile({
      name: "Phrozen Sonic Mini 8K",
      type: "MSLA",
      manufacturer: "Phrozen",
      buildVolume: { x: 165, y: 72, z: 180 },
      resolution: { xy: 0.022, z: 0.01 },
      settings: {
        screenResolution: { x: 7500, y: 3240 },
        lightSource: "Mono LCD",
        wavelength: 405,
        normalExposure: 2.2,
        baseExposure: 35,
        baseLayers: 5,
        liftDistance: 5,
        liftSpeed: 150,
        retractSpeed: 200,
        antiAliasing: 8
      }
    });

    // Additional Fiber Laser Profiles
    this.addLaserProfile({
      name: "Raycus 50W Fiber",
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
        pulseFrequency: 30000,
        pulseWidth: 0.04,
        assistGas: {
          type: "nitrogen",
          pressure: 8
        }
      }
    });

    this.addLaserProfile({
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
    });
  }

  async importProfile(profileData: string): Promise<boolean> {
    try {
      const data = JSON.parse(profileData);
      if (data.type === 'printer') {
        this.addPrinterProfile(data.profile);
      } else if (data.type === 'laser') {
        this.addLaserProfile(data.profile);
      } else if (data.type === 'material') {
        this.addMaterialProfile(data.profile);
      }
      return true;
    } catch (error) {
      console.error('Profile import failed:', error);
      return false;
    }
  }

  exportProfile(profileName: string, type: 'printer' | 'laser' | 'material'): string {
    let profile;
    switch (type) {
      case 'printer':
        profile = this.printerProfiles.get(profileName);
        break;
      case 'laser':
        profile = this.laserProfiles.get(profileName);
        break;
      case 'material':
        profile = this.materialProfiles.get(profileName);
        break;
    }

    if (!profile) throw new Error(`Profile not found: ${profileName}`);

    return JSON.stringify({
      type,
      profile,
      version: '1.0',
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  addPrinterProfile(profile: PrinterProfile): void {
    this.printerProfiles.set(profile.name, profile);
  }

  addLaserProfile(profile: LaserProfile): void {
    this.laserProfiles.set(profile.name, profile);
  }

  addMaterialProfile(profile: MaterialProfile): void {
    const existingProfiles = this.materialProfiles.get(profile.type) || [];
    this.materialProfiles.set(profile.type, [...existingProfiles, profile]);
  }

  getPrinterProfile(name: string): PrinterProfile | undefined {
    return this.printerProfiles.get(name);
  }

  getLaserProfile(name: string): LaserProfile | undefined {
    return this.laserProfiles.get(name);
  }

  getMaterialProfiles(type: string): MaterialProfile[] {
    return this.materialProfiles.get(type) || [];
  }

  getAllPrinterProfiles(): PrinterProfile[] {
    return Array.from(this.printerProfiles.values());
  }

  getAllLaserProfiles(): LaserProfile[] {
    return Array.from(this.laserProfiles.values());
  }

  getAllMaterialTypes(): string[] {
    return Array.from(this.materialProfiles.keys());
  }
}