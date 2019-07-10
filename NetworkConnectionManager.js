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
const TYPES = __importStar(require("./DataCollectors/Enumerators/EnumeratorCollection"));
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
            this.ws.addEventListener("message", (_receivedMessage) => {
                this.parseMessageAndCallCorrespondingMessageHandler(_receivedMessage);
            });
        };
        this.parseMessageAndCallCorrespondingMessageHandler = (_receivedMessage) => {
            // tslint:disable-next-line: typedef
            let objectifiedMessage = this.parseReceivedMessageAndReturnObject(_receivedMessage);
            switch (objectifiedMessage.messageType) {
                case TYPES.MESSAGE_TYPE.LOGIN_RESPONSE:
                    console.log("LOGIN SUCCESS", objectifiedMessage.loginSuccess);
                    this.loginValidAddUser(objectifiedMessage.originatorId, objectifiedMessage.loginSuccess);
                    break;
                // case TYPES.MESSAGE_TYPE.RTC_OFFER:
                //     this.setDescriptionOnOfferAndSendAnswer(objectifiedMessage.clientId, objectifiedMessage.offer, objectifiedMessage.userNameToConnectTo);
                //     break;
                // case TYPES.MESSAGE_TYPE.RTC_ANSWER:
                //     this.setDescriptionAsAnswer(objectifiedMessage.clientId, objectifiedMessage.answer);
                //     break;
                // case TYPES.MESSAGE_TYPE.ICE_CANDIDATE:
                //     this.handleCandidate(objectifiedMessage.clientId, objectifiedMessage.candidate);
                //     break;
            }
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
        this.sendMessage = (message) => {
            this.ws.send(JSON.stringify(message));
        };
        // public handleCandidate = (_localhostId: string, _candidate: RTCIceCandidateInit | undefined) => {
        //     console.log("Adding ice candidates");
        //     this.connection.addIceCandidate(new RTCIceCandidate(_candidate));
        // }
        // public setDescriptionAsAnswer = (_localhostId: string, _answer: RTCSessionDescriptionInit) => {
        //     console.log("Setting description as answer");
        //     this.connection = new RTCPeerConnection(this.configuration);
        //     this.connection.setRemoteDescription(new RTCSessionDescription(_answer));
        //     console.log("Description set as answer");
        // }
        // // TODO https://stackoverflow.com/questions/37787372/domexception-failed-to-set-remote-offer-sdp-called-in-wrong-state-state-sento/37787869
        // // DOMException: Failed to set remote offer sdp: Called in wrong state: STATE_SENTOFFER
        // public setDescriptionOnOfferAndSendAnswer = (_localhostId: string, _offer: RTCSessionDescriptionInit, _usernameToRespondTo: string): void => {
        //     console.log("Setting description on offer and sending answer");
        //     this.userNameLocalIsConnectedTo = _usernameToRespondTo;
        //     this.connection.setRemoteDescription(new RTCSessionDescription(_offer));
        //     // Signaling example from here https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
        //     this.connection.createAnswer()
        //         .then((answer) => {
        //             console.log("Setting local description now.");
        //             return this.connection.setLocalDescription(answer);
        //         }).then(() => {
        //             const answerMessage: NetworkMessages.RtcAnswer = new NetworkMessages.RtcAnswer(this.localClientId, this.userNameLocalIsConnectedTo, this.connection.localDescription);
        //             this.sendMessage(answerMessage);
        //             console.log("Created answer message and sent: ", answerMessage);
        //         })
        //         .catch(() => {
        //             console.error("Answer creation failed.");
        //         });
        //     // this.connection.createAnswer(undefined);
        //     // this.connection.createAnswer(
        //     //     (answer: RTCSessionDescriptionInit) => {
        //     //         this.connection.setLocalDescription(answer);
        //     //         const answerMessage = new MessageAnswer(this.otherUsername, answer);
        //     //         this.sendMessage(answerMessage);
        //     //     },
        //     // ).then () => {
        //     //     alert("Error when creating an answer");
        //     //     console.error(error);
        //     // };
        // }
        //     public createRTCConnection = () => {
        //         this.connection = new RTCPeerConnection(this.configuration);
        //         this.peerConnectionToChosenPeer = this.connection.createDataChannel("testChannel");
        //         this.connection.ondatachannel = (datachannelEvent) => {
        //             console.log("Data channel is created!");
        //             datachannelEvent.channel.addEventListener("open", () => {
        //                 console.log("Data channel is open and ready to be used.");
        //             });
        //             datachannelEvent.channel.addEventListener("message", (messageEvent) => {
        //                 console.log("Received message: " + messageEvent.data);
        //                 UiElementHandler.chatbox.innerHTML += "\n" + this.userNameLocalIsConnectedTo + ": " + messageEvent.data;
        //             });
        //         };
        //         this.peerConnectionToChosenPeer.onmessage = (event) => {
        //             console.log("Received message from other peer:", event.data);
        //             UiElementHandler.chatbox.innerHTML += "<br>" + event.data;
        //         };
        //         this.connection.onicecandidate = (event) => {
        //             if (event.candidate) {
        //                 const candidateMessage: NetworkMessages.IceCandidate = new NetworkMessages.IceCandidate(this.localClientId, this.userNameLocalIsConnectedTo, event.candidate);
        //                 this.sendMessage(candidateMessage);
        //             }
        //         };
        //     }
        //     public connectToUser = (): void => {
        //         // const callUsernameElement =  document.querySelector("input#username-to-call") as HTMLInputElement;
        //         // const callToUsername = callUsernameElement.value;
        //         const callToUsername: string = UiElementHandler.usernameToConnectTo.value;
        //         if (callToUsername.length === 0) {
        //             alert("Enter a username 😉");
        //             return;
        //         }
        //         this.userNameLocalIsConnectedTo = callToUsername;
        //         this.createRtcOffer(this.userNameLocalIsConnectedTo);
        //     }
        //     public createRtcOffer = (_userNameForOffer: string): void => {
        //         this.connection.createOffer().then((offer) => {
        //             return this.connection.setLocalDescription(offer);
        //         }).then(() => {
        //             const offerMessage: NetworkMessages.RtcOffer = new NetworkMessages.RtcOffer(this.localClientId, _userNameForOffer, this.connection.localDescription);
        //             this.sendMessage(offerMessage);
        //         })
        //             .catch(() => {
        //                 console.error("Offer creation error");
        //             });
        //         // this.connection.createOffer(
        //         //     (offer: RTCSessionDescriptionInit) => {
        //         //         const offerMessage = new MessageOffer(userNameForOffer, offer);
        //         //         this.connection.setLocalDescription(offer);
        //         //         this.sendMessage(offerMessage);
        //         //     },
        //         //     (error) => {
        //         //         alert("Error when creating an offer");
        //         //         console.error(error);
        //         //     },
        //         // );
        //     }
        //     public sendMessageToUser = () => {
        //         // const messageField =  document.getElementById("msgInput") as HTMLInputElement;
        //         // const message = messageField.value;
        //         const message: string = UiElementHandler.msgInput.value;
        //         UiElementHandler.chatbox.innerHTML += "\n" + this.localUserName + ": " + message;
        //         if (this.peerConnectionToChosenPeer) {
        //             this.peerConnectionToChosenPeer.send(message);
        //         }
        //         else {
        //             console.error("Peer Connection undefined, connection likely lost");
        //         }
        //     }
        // tslint:disable-next-line: no-any
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
        this.ws = new WebSocket("ws://localhost:8080");
        this.localUserName = "";
        this.localClientId = "undefined";
        this.connection = new RTCPeerConnection();
        this.remoteConnection = null;
        this.userNameLocalIsConnectedTo = "";
        this.peerConnectionToChosenPeer = undefined;
        UiElementHandler_1.UiElementHandler.getAllUiElements();
        this.addUiListeners();
        this.addWsEventListeners();
    }
}
exports.NetworkConnectionManager = NetworkConnectionManager;
