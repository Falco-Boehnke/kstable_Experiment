"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///<reference path="DataCollectors/Enumerators/EnumeratorCollection.ts"/>
///<reference path="NetworkMessages/IceCandidate.ts"/>
///<reference path="NetworkMessages/LoginRequest.ts"/>
///<reference path="NetworkMessages/MessageBase.ts"/>
///<reference path="NetworkMessages/RtcAnswer.ts"/>
///<reference path="NetworkMessages/RtcOffer.ts"/>
const UiElementHandler_1 = require("./DataCollectors/UiElementHandler");
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
                console.log("Connected to the signaling server");
            });
            this.ws.addEventListener("error", (err) => {
                console.error(err);
            });
            this.ws.addEventListener("message", (msg) => {
                console.log("Got message", msg.data);
                const data = JSON.parse(msg.data);
                switch (data.type) {
                    case "login":
                        this.loginValidAddUser(data.success);
                        break;
                    case "offer":
                        this.setDescriptionOnOfferAndSendAnswer(data.offer, data.username);
                        break;
                    case "answer":
                        this.setDescriptionAsAnswer(data.answer);
                        break;
                    case "candidate":
                        this.handleCandidate(data.candidate);
                        break;
                }
            });
        };
        this.handleCandidate = (_candidate) => {
            this.connection.addIceCandidate(new RTCIceCandidate(_candidate));
        };
        this.setDescriptionAsAnswer = (_answer) => {
            this.connection.setRemoteDescription(new RTCSessionDescription(_answer));
        };
        this.setDescriptionOnOfferAndSendAnswer = (_offer, _username) => {
            this.otherUsername = _username;
            this.connection.setRemoteDescription(new RTCSessionDescription(_offer));
            // Signaling example from here https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
            this.connection.createAnswer()
                .then((answer) => {
                return this.connection.setLocalDescription(answer);
            }).then(() => {
                const answerMessage = new NetworkMessages.RtcAnswer(this.otherUsername, this.connection.localDescription);
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
        this.loginValidAddUser = (_loginSuccess) => {
            if (_loginSuccess) {
                console.log("Login succesfully done");
                this.createRTCConnection();
                console.log("COnnection at Login: ", this.connection);
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
                    const candidateMessage = new NetworkMessages.IceCandidate(this.otherUsername, event.candidate);
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
                const offerMessage = new NetworkMessages.RtcOffer(_userNameForOffer, this.connection.localDescription);
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
        this.connection = new RTCPeerConnection();
        this.otherUsername = "";
        this.peerConnection = undefined;
        UiElementHandler_1.UiElementHandler.getAllUiElements();
        this.addUiListeners();
        this.addWsEventListeners();
    }
}
exports.NetworkConnectionManager = NetworkConnectionManager;
