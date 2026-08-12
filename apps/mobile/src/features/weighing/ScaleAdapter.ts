export interface ScaleReading { weightKg: number; source: 'MANUAL' | 'SIMULATOR'; capturedAt: string; }
export interface ScaleAdapter { readonly label: string; read(): Promise<ScaleReading>; }
export class ManualScale implements ScaleAdapter { readonly label='Input Manual'; constructor(private readonly weightKg:number){} async read(){return{weightKg:this.weightKg,source:'MANUAL' as const,capturedAt:new Date().toISOString()}} }
export class DemoScale implements ScaleAdapter { readonly label='Simulator Timbangan Demo'; constructor(private readonly weightKg=10){} async read(){return{weightKg:this.weightKg,source:'SIMULATOR' as const,capturedAt:new Date().toISOString()}} }
