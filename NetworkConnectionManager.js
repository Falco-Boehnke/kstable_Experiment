"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const UiElementHandler_1 = require("./DataCollectors/UiElementHandler");
const NetworkMessages = __importStar(require("./NetworkMessages"));
class NetworkConnectionManager {
    // More info from here https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
    //     var configuration = { iceServers: [{
    //         urls: "stun:stun.services.mozilla.com",
    //         username: "louis@mozilla.com",
    //         credential: "webrtcdemo"
    //     }, {
    //         urls: ["stun:stun.example.com", "stun:stun-1.example.com"]
    //     }]
    // };
    constructor() {
        // tslint:disable-next-line: typedef
        this.configuration = {
            iceServers: [
                { urls: "stun:stun2.1.google.com:19302" },
                { urls: "stun:stun.example.com" }
            ]
        };
        this.isNegotiating = false;
        this.addUiListeners = () => {
            UiElementHandler_1.UiElementHandler.getAllUiElements();
            console.log(UiElementHandler_1.UiElementHandler.loginButton);
            UiElementHandler_1.UiElementHandler.loginButton.addEventListener("click", this.loginLogic);
            //TODO
            // UiElementHandler.connectToUserButton.addEventListener("click", this.connectToUser);
            // UiElementHandler.sendMsgButton.addEventListener("click", this.sendMessageToUser);
        };
        this.addWsEventListeners = () => {
            this.ws.addEventListener("open", (_connOpen) => {
                console.log("Conneced to the signaling server", _connOpen);
            });
            this.ws.addEventListener("error", (_err) => {
                console.error(_err);
            });
            // this.ws.addEventListener("message", (_receivedMessage: MessageEvent) => {
            //     this.parseMessageAndCallCorrespondingMessageHandler(_receivedMessage);
            // });
            this.ws.onmessage = async ({ data: { desc, candidate } }) => {
                if (!this.connection)
                    this.startConnecting(false);
                try {
                    if (desc) {
                        if (desc.type == "offer") {
                            await this.connection.setRemoteDescription(desc);
                            await this.peerConnectionToChosenPeer.setLocalDescription(await this.connection.createAnswer());
                            this.sendMessage({ desc: this.connection.localDescription });
                        }
                        else {
                            await this.connection.setRemoteDescription(desc);
                        }
                    }
                    else {
                        await this.connection.addIceCandidate(candidate);
                    }
                }
                catch (err) {
                    console.error(err);
                }
            };
        };
        this.setupChat = () => {
            if (!this.datachannel)
                return;
            this.datachannel.addEventListener("open", () => { console.log("Peerconnectin open"); });
            this.datachannel.addEventListener("message", (messageEvent) => {
                console.log("Received message: " + messageEvent.data);
                UiElementHandler_1.UiElementHandler.chatbox.innerHTML += "\n" + this.userNameLocalIsConnectedTo + ": " + messageEvent.data;
            });
        };
        this.parseReceivedMessageAndReturnObject = (_receivedMessage) => {
            console.log("Got message", _receivedMessage);
            // tslint:disable-next-line: no-any
            let objectifiedMessage;
            try {
                objectifiedMessage = JSON.parse(_receivedMessage.data);
            }
            catch (error) {
                console.error("Invalid JSON", error);
            }
            return objectifiedMessage;
        };
        this.sendMessage = (message) => {
            this.ws.send(JSON.stringify(message));
        };
        this.loginValidAddUser = (_assignedId, _loginSuccess) => {
            if (_loginSuccess) {
                this.localClientId = _assignedId;
                // this.createRTCConnection();
                console.log("COnnection at Login: " + this.localClientId + " ", this.connection);
            }
            else {
                console.log("Login failed, username taken");
            }
        };
        this.loginLogic = () => {
            if (UiElementHandler_1.UiElementHandler.loginNameInput != null) {
                this.localUserName = UiElementHandler_1.UiElementHandler.loginNameInput.value;
            }
            else {
                console.error("UI element missing: Loginname Input field");
            }
            console.log(this.localUserName);
            if (this.localUserName.length <= 0) {
                console.log("Please enter username");
                return;
            }
            const loginMessage = new NetworkMessages.LoginRequest(this.localUserName);
            console.log(loginMessage);
            this.sendMessage(loginMessage);
        };
        this.ws = new WebSocket("ws://localhost:8080");
        this.localUserName = "";
        this.localClientId = "undefined";
        this.connection = new RTCPeerConnection(this.configuration);
        this.remoteConnection = null;
        this.userNameLocalIsConnectedTo = "";
        this.peerConnectionToChosenPeer = undefined;
        this.isInitiator = false;
        UiElementHandler_1.UiElementHandler.getAllUiElements();
        this.addUiListeners();
        this.addWsEventListeners();
    }
    startConnecting(_isInitiator) {
        this.peerConnectionToChosenPeer = new RTCPeerConnection(this.configuration);
        // send any ice candidates to the other peer
        this.peerConnectionToChosenPeer.onicecandidate = (candidate) => {
            this.sendMessage(candidate);
        };
        // let the "negotiationneeded" event trigger offer generation
        this.peerConnectionToChosenPeer.onnegotiationneeded = async () => {
            try {
                await this.peerConnectionToChosenPeer.setLocalDescription(await this.peerConnectionToChosenPeer.createOffer());
                // send the offer to the other peer
                this.sendMessage({ desc: this.peerConnectionToChosenPeer.localDescription });
            }
            catch (err) {
                console.error(err);
            }
        };
        if (this.isInitiator) {
            // create data channel and setup chat
            this.datachannel = this.connection.createDataChannel("chat");
            this.setupChat();
        }
        else {
            // setup chat on incoming data channel
            this.connection.ondatachannel = (event) => {
                this.datachannel = event.channel;
                this.setupChat();
            };
        }
    }
}
exports.NetworkConnectionManager = NetworkConnectionManager;
