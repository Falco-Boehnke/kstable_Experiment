namespace NetworkMessages {

    export class MessageAnswer implements MessageBase {

        public messageType: MESSAGE_TYPE = MESSAGE_TYPE.RTC_ANSWER;
        public userNameToConnectTo: string;
        public answer: RTCSessionDescription | null;
        constructor(userNameToConnectTo: string, _answer: RTCSessionDescription | null) {
            this.userNameToConnectTo = userNameToConnectTo;
            this.answer = _answer;

        }

    }
}
