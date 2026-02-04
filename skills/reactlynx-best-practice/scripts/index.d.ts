import { Diagnostic } from './background-only';
export declare function runSkill(source: string): Diagnostic[];
export declare const rules: {
    'detect-background-only': {
        id: string;
        severity: "error";
        message: string;
    };
};
