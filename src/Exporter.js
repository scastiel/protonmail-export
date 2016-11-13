// @flow

import fs from 'fs-promise';
import ConversationFetcher from './ConversationFetcher';

export default class Exporter {
    conversationFetcher: ConversationFetcher;
    constructor(conversationFetcher: ConversationFetcher) {
        this.conversationFetcher = conversationFetcher;
    }
    async exportEmails(outputDirectory: string, number: number = 10) {
        const conversationsList = await this.conversationFetcher.getConversationsList();
        for (let conversation of conversationsList.Conversations.slice(0, number)) {
            await this.conversationFetcher.populateConversation(conversation);
            const messages = await this.conversationFetcher.getMessagesFromConversation(conversation);
            for (let message of messages) {
                const messageString = this._getFullDecryptedMessageAsString(message)
                await fs.writeFile(outputDirectory + '/' + message.ID + '.eml', messageString);
            }
        }
    }
    _getHeaderFromMessage(message: any): string {
        const header = message.Header.replace(/\r?\n\t/gm, '');
        if (header.match(/Content-type:/i)) {
            return header.replace(/Content-Type: (.*)/i, `Content-type: ${message.MIMEType}; charset=UTF-8`);
        } else {
            return header.replace(/(\n+)$/m, `\nContent-type: ${message.MIMEType}; charset=UTF-8$1`);
        }
    }
    _getFullDecryptedMessageAsString(message: any): string {
        const header = this._getHeaderFromMessage(message);
        return `${header}\n${message.BodyDecrypted}`;
    }
}
