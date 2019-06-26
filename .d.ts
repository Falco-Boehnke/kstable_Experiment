declare module "NetworkMessages/MessageBase" {
    export interface MessageBase {
        readonly messageType: MESSAGE_TYPE;
    }
}
declare module "NetworkMessages/MessageAnswer" {
    import { MessageBase } from "NetworkMessages/MessageBase";
    export class MessageAnswer implements MessageBase {
        messageType: MESSAGE_TYPE;
        userNameToConnectTo: string;
        answer: RTCSessionDescription | null;
        constructor(_userNameToConnectTo: string, _answer: RTCSessionDescription | null);
    }
}
declare module "NetworkMessages/MessageCandidate" {
    import { MessageBase } from "NetworkMessages/MessageBase";
    export class MessageCandidate implements MessageBase {
        messageType: MESSAGE_TYPE;
        userNameToConnectTo: string;
        candidate: RTCIceCandidate;
        constructor(_userNameToConnectTo: string, _candidate: RTCIceCandidate);
    }
}
declare module "NetworkMessages/MessageLoginRequest" {
    import { MessageBase } from "NetworkMessages/MessageBase";
    export class MessageLoginRequest implements MessageBase {
        messageType: MESSAGE_TYPE;
        loginUserName: string;
        constructor(_loginUserName: string);
    }
}
declare module "NetworkMessages/MessageOffer" {
    import { MessageBase } from "NetworkMessages/MessageBase";
    export class MessageOffer implements MessageBase {
        messageType: MESSAGE_TYPE;
        userNameToConnectTo: string;
        offer: RTCSessionDescription | RTCSessionDescriptionInit | null;
        constructor(_userNameToConnectTo: string, _offer: RTCSessionDescription | RTCSessionDescriptionInit | null);
    }
}
declare module "NetworkMessages/index" {
    export { MessageAnswer } from "NetworkMessages/MessageAnswer";
    export { MessageCandidate } from "NetworkMessages/MessageCandidate";
    export { MessageLoginRequest } from "NetworkMessages/MessageLoginRequest";
    export { MessageOffer } from "NetworkMessages/MessageOffer";
    export { MessageBase } from "NetworkMessages/MessageBase";
}
declare module "DataCollectors/UiElementHandler" {
    export abstract class UiElementHandler {
        static signalingSubmit: HTMLElement;
        static signalingUrl: HTMLInputElement;
        static loginNameInput: HTMLElement;
        static loginButton: HTMLElement;
        static msgInput: HTMLInputElement;
        static chatbox: HTMLInputElement;
        static sendMsgButton: HTMLElement;
        static connectToUserButton: HTMLElement;
        static usernameToConnectTo: HTMLInputElement;
        static disconnectButton: HTMLElement;
        static getAllUiElements(): void;
    }
}
declare module "NetworkConnectionManager" {
    export class NetworkConnectionManager {
        ws: WebSocket;
        username: string;
        connection: RTCPeerConnection;
        otherUsername: string;
        peerConnection: RTCDataChannel;
        configuration: {
            iceServers: {
                urls: string;
            }[];
        };
        constructor();
        addUiListeners: () => void;
        addWsEventListeners: () => void;
        handleCandidate: (_candidate: RTCIceCandidateInit | undefined) => void;
        handleAnswer: (_answer: RTCSessionDescriptionInit) => void;
        handleOffer: (_offer: RTCSessionDescriptionInit, _username: string) => void;
        handleLogin: (_loginSuccess: boolean) => void;
        loginLogic: () => void;
        createRTCConnection: () => void;
        connectToUser: () => void;
        createRtcOffer: (_userNameForOffer: string) => void;
        sendMessage: (message: Object) => void;
        sendMessageToUser: () => void;
    }
}
declare const electron: any;
declare const app: any, BrowserWindow: any;
declare let win: any;
declare function createWindow(): void;
declare module "renderer" { }
declare namespace DataCollectors {
    class Client {
        clientConnection: WebSocket | null;
        id: string;
        userName: string;
        connectedRoom: ServerRoom | null;
        constructor();
    }
}
declare namespace DataCollectors {
    class ServerRoom {
    }
}
declare enum MESSAGE_TYPE {
    UNDEFINED = "undefined",
    LOGIN = "login",
    RTC_OFFER = "offer",
    RTC_ANSWER = "answer",
    RTC_CANDIDATE = "candidate"
}
declare enum TEST_ENUM {
    SERIOUSLY = "wtf"
}
declare module "Server/ServerMain" { }
