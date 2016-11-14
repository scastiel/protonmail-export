// @flow

import fetch from 'node-fetch';
import * as openpgp from 'openpgp';

export default class ConversationsFetcher {
    _headers: any;
    _privateKey: string;
    _logger: (msg: string) => any;
    _counts: any | null;
    static BASE_URL: string = 'https://mail.protonmail.com/api';
    constructor(cookie: any, sessionId: string, privateKey: string, logger: (msg: string) => any) {
        this._headers = {
            cookie,
            'x-pm-apiversion': '1',
            'x-pm-appversion': 'Web_3.5.12',
            'x-pm-session': sessionId
        }
        this._privateKey = privateKey;
        this._logger = logger;
        this._counts = null;
    }
    async getConversationsInPageWithLabel(page: number, label: number): Promise<any> {
        const url = `${ConversationsFetcher.BASE_URL}/conversations?Label=${label}&Limit=100&Page=${page}`;
        const result = await fetch(url, { headers: this._headers });
        const convList = await result.json();
        return convList.Conversations;
    }
    async getConversationsCountForLabel(label: number): Promise<number> {
        if (!this._counts) {
            const url = `${ConversationsFetcher.BASE_URL}/conversations/count`;
            const result = await fetch(url, { headers: this._headers });
            this._counts = (await result.json()).Counts.reduce((acc, c) => ({ ... acc, [c.LabelID]: c.Total }), {});
        }
        return this._counts[label];
    }
    async getConversationsWithLabel(label: number): Promise<Array<any>> {
        const conversations: Array<any> = [];
        const conversationsCount = await this.getConversationsCountForLabel(label);
        this._logger(`${conversationsCount} conversations to fetch for label ${label}.`);
        for (let page = 0; page < (conversationsCount / 100) + 1; page++) {
            this._logger(`Fetching conversations in page ${page}...`);
            conversations.push(... await this.getConversationsInPageWithLabel(page, label));
        }
        return conversations;
    }
    async getConversations(): Promise<Array<any>> {
        const conversations: Array<any> = [];
        const labels = [0, 2, 6];
        for (let label of labels) {
            this._logger(`Fetching conversations for label ${label}...`);
            conversations.push(... await this.getConversationsWithLabel(label));
        }
        return conversations;
    }
    async populateConversation(conversation: any): Promise<any> {
        this._logger(`Populating conversation ${conversation.ID}...`);
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
        try {
            const messageBody = await openpgp.decrypt({
                message: openpgp.message.readArmored(message.Body),
                privateKey: this._privateKey
            });
            message.BodyDecrypted = messageBody.data;
        } catch (err) {}
        return message;
    }
}
