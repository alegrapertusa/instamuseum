export class ClientLogger {
    static logs: string[] = [];

    static log(msg: string) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${msg}`;
        console.log(entry);
        this.logs.push(entry);
    }

    static clear() {
        this.logs = [];
    }

    static getLogs() {
        return this.logs;
    }
}
