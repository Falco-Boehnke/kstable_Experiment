/// <reference path = "./MessageBase.ts" />
namespace NetworkMessages {

    export class RtcOffer implements MessageBase {

        public messageType: MESSAGE_TYPE = MESSAGE_TYPE.RTC_OFFER;
        public userNameToConnectTo: string;
        public offer: RTCSessionDescription | RTCSessionDescriptionInit | null;
        constructor(_userNameToConnectTo: string, _offer: RTCSessionDescription | RTCSessionDescriptionInit | null) {
            this.userNameToConnectTo = _userNameToConnectTo;
            this.offer = _offer;
        }

    }
}