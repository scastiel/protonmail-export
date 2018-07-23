# Export your ProtonMail e-mails

> **Disclaimer: this repository is not maintained anymore! Now [ProtonMail Bridge](https://protonmail.com/bridge/) is is easiest way to export all your e-mails using IMAP.**

[ProtonMail](https://protonmail.com/) does not provide (yet) a way to export your e-mails, like an IMAP access or any export option. That would be very nice, for several usages:

- back up your e-mails, in case of a massive nuclear explosion near ProtonMail's servers;
- move your e-mails to another mail provider if you're not satisfied with ProtonMail;
- etc.

Additionaly, I strongly believe that every service on the Internet, no matter how great it is, and especially if you pay for it, should be easy to leave for another.

It's still possible, but you'll be forced to use undocumented ProtonMail API, proceeding by retro-engineering. This small program will make the process very easier for you, although not fully automated.

Of course, I hope that very soon this program won't be necessary anymore because [ProtonMail will provide such an option](https://protonmail.com/support/knowledge-base/export-import-emails/) :)

## Features

Implemented:

- Export your e-mails (decrypted) to local [EML](https://en.wikipedia.org/wiki/Email#Filename_extensions) files you can then import in another mail client.
- Fetches your e-mails from *Inbox*, *Sent* and *Archives* folder.

Not implemented yet:

- Export attached files.

## Installation

You'll need to have *Node.js* installed on your system, with its package manager *npm*.

To install the program run the following command: `npm install -g protonmail-export`

## How to download your ProtonMail private key?

ProtonMail stores an encrypted version of your private key on its servers. From the settings pane of your account you can download your public key; unfortunately you cannot download your private key. The good news: you can very easilly find it using the development tools of your browser. Here's how:

1. Open the ProtonMail app and log out completely. You should now see the login screen.
2. Open the dev tools of your browser, and the _Network_ tab to see all network calls.
3. Enter your username and password and click _Login_ button.
4. In the network calls, find the one to “/api/auth”.
5. In this network call, open the *Response* tab to see raw data returned from the server, find the line beginning with `"KeySalt":` and copy the value without quotes to a file.
6. Find a post call to “/api/users”, there will be a section with addresses, find sections starting with `"PrivateKey":`, and copy the rest of the line, from `"-----BEGIN PGP PRIVATE KEY` to the last `"`, without the trailing comma.
7. Open the *Console* tab of the dev tools, type `console.log(<PASTE THE COPIED CONTENT HERE>)` then press enter.
8. Copy the result of the command, and put it into a text file, that's it you have your private key!
9. Repeat points 6-8 for all addresses to get all your private keys

Note that the private key is encrypted with a passphrase that is generated from key salt and your ProtonMail's account's password. So the private key you have now is not sufficient to decrypt your mail if someone steals it; however try to keep it somewhere secure ;). If you want to use the key elsewhere, you can use [pmpkpe](https://github.com/kantium/pmpkpe) to get the passphrase and import into your gpg keychain.

## How to export your e-mails?

First you'll need several elements:

* Your ProtonMail's account private key (see the appendice below), let's put it in a file named *private-key.txt* for instance.
* The passphrase used to encrypt this private key (i.e. the second password you enter while signing in).
* Some technical information about a session opened on ProtonMail.

Let's get the information mentionned in the last point.

_Note: these instructions are for Chrome/Chromium browser, but this shouldn't be very different for other browsers._

1. First open a new session with your ProtonMail's account, and make sure your browser development tools are open. If they weren't open on page load, just open them and reload the page.
2. In the *Network* tab of the development tools, locate the call to */api/users* URL, and more specifically the *Request Headers* section to this call.
3. Copy-paste somewhere the value of these two headers: *Cookie* (begins with ”AUTH-”) and *x-pm-session* (32 alphanumeric characters).

Once you have all this elements, you can finally export your mails by running the command:

```shell
protonmail-export -i "<session_id>" -c "<cookie>" -p <path_to_private_key_file> <output_directory>
```

For instance this might look like this: *(note that the output directory must already exist)*

```shell
protonmail-export -i "95bc88ea1e94e25357e12a433e9b5ee5" -c "AUTH-95bc88(...); NOTICE-ae3cce(...)=true" -p ~/private-key.txt ~/protonmail-messages
```

You'll be asked for your passphrase to decrypt your private key. Then you'll get in the output directory one file for each of your emails. It's possible with most of mail clients to read and import these file to an existing mailbox.

## Contribute

If you want to contribute please don't hesitate to make pull-requests :)

## Credits

This program uses the fantastic [OpenPGP.js](https://openpgpjs.org/) library to decrypt e-mails, which is maintained by ProtonMail.

## License

This program is provided under [GPL-v3.0](https://www.gnu.org/licenses/gpl.html).
