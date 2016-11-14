// @flow

import path from 'path';
import fs from 'fs-promise';
import * as openpgp from 'openpgp';
import program from 'commander';
import prompt from 'password-prompt';
import ConversationsFetcher from './ConversationFetcher';
import Exporter from './Exporter';

async function getPrivateKey(privateKeyFile: string): Promise<openpgp.key> {
    const privateKeyText = await fs.readFile(privateKeyFile, 'utf-8');
    return openpgp.key.readArmored(privateKeyText).keys[0];
}

async function decryptPrivateKey(privateKey: openpgp.key): Promise<void> {
    let ok = false;
    let firstTry = true;
    do {
        if (!firstTry) {
            console.log('Wrong passphrase.');
        }
        const passphrase = await prompt('Private key passphrase: ', { method: 'hide' });
        ok = privateKey.decrypt(passphrase);
        firstTry = false;
    } while (!ok);
}

async function getParams():
        Promise<{ cookie: string, sessionId: string, privateKey: openpgp.Key, outputDirectory: string }> {

    let outputDirectory = '';
    program
        .description('Export your ProtonMail e-mails.')
        .usage('[options] <existing_output_directory>')
        .option('-c, --cookie <string>', 'specify the cookie header to send to the API (required)')
        .option('-i, --session-id <string>', 'specify a valid session ID (required)')
        .option('-p, --private-key-file <path>', 'specify the path to a text file containing the private key (required)')
        .action(_outputDirectory => outputDirectory = _outputDirectory)
        .parse(process.argv);

    const errors = [];

    if (!outputDirectory) {
        errors.push('Output directory is required.');
    } else if (!await fs.exists(outputDirectory)) {
        errors.push(`Directory not found: ${outputDirectory}`);
    }

    if (!program.cookie) {
        errors.push('Cookie parameter is required.');
    }

    if (!program.sessionId) {
        errors.push('Session ID parameter is required.');
    }

    let privateKey: openpgp.key;
    if (!program.privateKeyFile) {
        errors.push('Private key file parameter is required.');
    } else if (!await fs.exists(program.privateKeyFile)) {
        errors.push(`Private key file not found: ${program.privateKeyFile}`);
    } else if (!(privateKey = await getPrivateKey(program.privateKeyFile))) {
        errors.push(`Invalid private key file: ${program.privateKeyFile}`);
    }

    if (errors.length > 0) {
        console.error(`Errors:\n${errors.map(e => ` - ${e}`).join('\n')}`);
        process.exit(1);
    }

    await decryptPrivateKey(privateKey);

    return { cookie: program.cookie, sessionId: program.sessionId, privateKey, outputDirectory };
}

async function main(): Promise<void> {
    const { cookie, sessionId, privateKey, outputDirectory } = await getParams();
    const logger = (msg: string) => console.log(msg);
    const conversationFetcher = new ConversationsFetcher(cookie, sessionId, privateKey, logger);
    const exporter = new Exporter(conversationFetcher, logger);
    return await exporter.exportEmails(outputDirectory);
}

main().then(() => {}).catch(err => console.error(err.stack));
