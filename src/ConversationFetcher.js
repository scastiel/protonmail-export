// @flow

import fetch from 'node-fetch';
import * as openpgp from 'openpgp';

export default class ConversationsFetcher {
    _headers: any;
    _privateKey: string;
    static BASE_URL: string = 'https://mail.protonmail.com/api';
    constructor(cookie: any, sessionId: string, privateKey: string) {
        this._headers = {
            cookie,
            'x-pm-apiversion': '1',
            'x-pm-appversion': 'Web_3.5.12',
            'x-pm-session': sessionId
        }
        this._privateKey = privateKey;
    }
    async getConversationsList(): Promise<any> {
        const url = `${ConversationsFetcher.BASE_URL}/conversations?Label=6&Limit=10&Page=0`;
        const result = await fetch(url, { headers: this._headers });
        return await result.json();
    }
    async populateConversation(conversation: any): Promise<any> {
        const url = `${ConversationsFetcher.BASE_URL}/conversations/${conversation.ID}`;
        const result = await fetch(url, { headers: this._headers });
        const newConversation = await result.json();
        Object.assign(conversation, newConversation.Conversation, { Messages: newConversation.Messages });
        return conversation;
    }
    async getMessagesFromConversation(conversation: any): Promise<[any]> {
        for (let message of conversation.Messages) {
            if (!message.Body) {
                await this.populateMessage(message);
            }
            if (!message.BodyDecrypted) {
                await this.decryptMessageBody(message);
            }
        }
        return conversation.Messages;
    }
    async populateMessage(message: any): Promise<any> {
        const url = `${ConversationsFetcher.BASE_URL}/messages/${message.ID}`;
        const result = await fetch(url, { headers: this._headers });
        const newMessage = await result.json();
        Object.assign(message, newMessage.Message);
    }
    async decryptMessageBody(message: any): Promise<any> {
        const messageBody = await openpgp.decrypt({
            message: openpgp.message.readArmored(message.Body),
            privateKey: this._privateKey
        });
        message.BodyDecrypted = messageBody.data;
        return message;
    }
}
