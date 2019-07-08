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
    constructor() {
        // More info from here https://developer.mozilla.org/en-US/docs/Web/API/RTCConfiguration
        //     var configuration = { iceServers: [{
        //         urls: "stun:stun.services.mozilla.com",
        //         username: "louis@mozilla.com",
        //         credential: "webrtcdemo"
        //     }, {
        //         urls: ["stun:stun.example.com", "stun:stun-1.example.com"]
        //     }]
        // };
        this.configuration = {
            iceServers: [
                { urls: "stun:stun2.1.google.com:19302" },
                { urls: "stun:stun.example.com" },
            ],
        };
        this.addUiListeners = () => {
            UiElementHandler_1.UiElementHandler.getAllUiElements();
            console.log(UiElementHandler_1.UiElementHandler.loginButton);
            UiElementHandler_1.UiElementHandler.loginButton.addEventListener("click", this.loginLogic);
            UiElementHandler_1.UiElementHandler.connectToUserButton.addEventListener("click", this.connectToUser);
            UiElementHandler_1.UiElementHandler.sendMsgButton.addEventListener("click", this.sendMessageToUser);
        };
        this.addWsEventListeners = () => {
            this.ws.addEventListener("open", () => {
                console.log("Conneced to the signaling server");
            });
            this.ws.addEventListener("error", (err) => {
                console.error(err);
            });
            this.ws.addEventListener("message", (_receivedMessage) => {
                console.log("Got message", _receivedMessage);
                let objectifiedMessage;
                try {
                    objectifiedMessage = JSON.parse(_receivedMessage.data);
                }
                catch (error) {
                    console.error("Invalid JSON", error);
                }
                if (objectifiedMessage == null) {
                    console.error("Empty Message received");
                    return;
                }
                switch (objectifiedMessage.messageType) {
                    case TYPES.MESSAGE_TYPE.LOGIN_RESPONSE:
                        console.log("LOGIN SUCCESS", objectifiedMessage.loginSuccess);
                        this.loginValidAddUser(objectifiedMessage.originatorId, objectifiedMessage.loginSuccess);
                        break;
                    case TYPES.MESSAGE_TYPE.RTC_OFFER:
                        this.setDescriptionOnOfferAndSendAnswer(objectifiedMessage.clientId, objectifiedMessage.offer, objectifiedMessage.username);
                        break;
                    case TYPES.MESSAGE_TYPE.RTC_ANSWER:
                        this.setDescriptionAsAnswer(objectifiedMessage.clientId, objectifiedMessage.answer);
                        break;
                    case TYPES.MESSAGE_TYPE.ICE_CANDIDATE:
                        this.handleCandidate(objectifiedMessage.clientId, objectifiedMessage.candidate);
                        break;
                }
            });
        };
        this.handleCandidate = (_localhostId, _candidate) => {
            this.connection.addIceCandidate(new RTCIceCandidate(_candidate));
        };
        this.setDescriptionAsAnswer = (_localhostId, _answer) => {
            this.connection.setRemoteDescription(new RTCSessionDescription(_answer));
        };
        this.setDescriptionOnOfferAndSendAnswer = (_localhostId, _offer, _username) => {
            this.otherUsername = _username;
            console.log("Answer creation username: ", _username);
            this.connection.setRemoteDescription(new RTCSessionDescription(_offer));
            // Signaling example from here https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
            this.connection.createAnswer()
                .then((answer) => {
                return this.connection.setLocalDescription(answer);
            }).then(() => {
                const answerMessage = new NetworkMessages.RtcAnswer(this.clientId, this.otherUsername, this.connection.localDescription);
                this.sendMessage(answerMessage);
            })
                .catch(() => {
                console.error("Answer creation failed.");
            });
            // this.connection.createAnswer(undefined);
            // this.connection.createAnswer(
            //     (answer: RTCSessionDescriptionInit) => {
            //         this.connection.setLocalDescription(answer);
            //         const answerMessage = new MessageAnswer(this.otherUsername, answer);
            //         this.sendMessage(answerMessage);
            //     },
            // ).then () => {
            //     alert("Error when creating an answer");
            //     console.error(error);
            // };
        };
        this.loginValidAddUser = (_assignedId, _loginSuccess) => {
            if (_loginSuccess) {
                this.clientId = _assignedId;
                this.createRTCConnection();
                console.log("COnnection at Login: " + this.clientId + " ", this.connection);
            }
            else {
                console.log("Login failed, username taken");
            }
        };
        this.loginLogic = () => {
            if (UiElementHandler_1.UiElementHandler.loginNameInput != null) {
                this.username = UiElementHandler_1.UiElementHandler.loginNameInput.value;
            }
            else {
                console.error("UI element missing: Loginname Input field");
            }
            console.log(this.username);
            if (this.username.length <= 0) {
                console.log("Please enter username");
                return;
            }
            const loginMessage = new NetworkMessages.LoginRequest(this.username);
            console.log(loginMessage);
            this.sendMessage(loginMessage);
        };
        this.createRTCConnection = () => {
            this.connection = new RTCPeerConnection(this.configuration);
            this.peerConnection = this.connection.createDataChannel("testChannel");
            this.connection.ondatachannel = (datachannelEvent) => {
                console.log("Data channel is created!");
                datachannelEvent.channel.addEventListener("open", () => {
                    console.log("Data channel is open and ready to be used.");
                });
                datachannelEvent.channel.addEventListener("message", (messageEvent) => {
                    console.log("Received message: " + messageEvent.data);
                    UiElementHandler_1.UiElementHandler.chatbox.innerHTML += "\n" + this.otherUsername + ": " + messageEvent.data;
                });
            };
            this.peerConnection.onmessage = (event) => {
                console.log("Received message from other peer:", event.data);
                UiElementHandler_1.UiElementHandler.chatbox.innerHTML += "<br>" + event.data;
            };
            this.connection.onicecandidate = (event) => {
                if (event.candidate) {
                    const candidateMessage = new NetworkMessages.IceCandidate(this.clientId, this.otherUsername, event.candidate);
                    this.sendMessage(candidateMessage);
                }
            };
        };
        this.connectToUser = () => {
            // const callUsernameElement =  document.querySelector("input#username-to-call") as HTMLInputElement;
            // const callToUsername = callUsernameElement.value;
            const callToUsername = UiElementHandler_1.UiElementHandler.usernameToConnectTo.value;
            if (callToUsername.length === 0) {
                alert("Enter a username 😉");
                return;
            }
            this.otherUsername = callToUsername;
            this.createRtcOffer(this.otherUsername);
        };
        this.createRtcOffer = (_userNameForOffer) => {
            this.connection.createOffer().then((offer) => {
                return this.connection.setLocalDescription(offer);
            }).then(() => {
                const offerMessage = new NetworkMessages.RtcOffer(this.clientId, _userNameForOffer, this.connection.localDescription);
                this.sendMessage(offerMessage);
            })
                .catch(() => {
                console.error("Offer creation error");
            });
            // this.connection.createOffer(
            //     (offer: RTCSessionDescriptionInit) => {
            //         const offerMessage = new MessageOffer(userNameForOffer, offer);
            //         this.connection.setLocalDescription(offer);
            //         this.sendMessage(offerMessage);
            //     },
            //     (error) => {
            //         alert("Error when creating an offer");
            //         console.error(error);
            //     },
            // );
        };
        this.sendMessage = (message) => {
            this.ws.send(JSON.stringify(message));
        };
        this.sendMessageToUser = () => {
            // const messageField =  document.getElementById("msgInput") as HTMLInputElement;
            // const message = messageField.value;
            const message = UiElementHandler_1.UiElementHandler.msgInput.value;
            UiElementHandler_1.UiElementHandler.chatbox.innerHTML += "\n" + this.username + ": " + message;
            if (this.peerConnection) {
                this.peerConnection.send(message);
            }
            else {
                console.error("Peer Connection undefined, connection likely lost");
            }
        };
        this.ws = new WebSocket("ws://localhost:8080");
        this.username = "";
        this.clientId = "undefined";
        this.connection = new RTCPeerConnection();
        this.otherUsername = "";
        this.peerConnection = undefined;
        UiElementHandler_1.UiElementHandler.getAllUiElements();
        this.addUiListeners();
        this.addWsEventListeners();
    }
}
exports.NetworkConnectionManager = NetworkConnectionManager;
