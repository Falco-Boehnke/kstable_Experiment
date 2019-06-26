import { MessageBase } from "./MessageBase";

export class MessageLoginRequest implements MessageBase {

        public messageType: MESSAGE_TYPE = MESSAGE_TYPE.LOGIN;
        public loginUserName: string = "";

        constructor(_loginUserName: string) {
            this.loginUserName = _loginUserName;
        }

    }
