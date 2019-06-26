namespace DataCollectors {
    export class Client {

        public clientConnection: WebSocket | null;
        public id: string;
        public userName: string;
        public connectedRoom: ServerRoom | null;

        constructor();
        constructor(websocketConnection?: WebSocket,
                    uniqueClientId?: string,
                    loginName?: string,
                    connectedToRoom?: ServerRoom) {

            this.clientConnection = websocketConnection || null;
            this.id = uniqueClientId || "";
            this.userName = loginName || "";
            this.connectedRoom = connectedToRoom || null;
        }
    }
}
