// Type declarations for external modules

declare module 'papaparse' {
    interface ParseConfig {
        header?: boolean;
        skipEmptyLines?: boolean;
        complete?: (results: ParseResult) => void;
        error?: (error: Error) => void;
    }

    interface ParseResult {
        data: any[];
        errors: any[];
        meta: any;
    }

    function parse(input: File | string, config?: ParseConfig): void;

    export default { parse };
    export { parse, ParseConfig, ParseResult };
}
