/**
 * Use of mailersend due to sendgrid SSO via Google causing the login page to crash currently.
 * clearing of cache does not help since sendgrid already has my email registered in their database, but i am unable to reset password / login since registered via Google SSO and basically bricked unless I create a new email to register
*/
const {
  MailerSend: MailerSendPkg,
  Recipient,
  EmailParams,
  Sender,
} = require('mailersend')
const { MAILERSEND_TOKEN } = require('../config')

class MailerSend {
  constructor() {
    this.createClient()
    // use of provided mailersend trial domain
    this.senderEmail = 'kyapwc@trial-3yxj6ljvdp5ldo2r.mlsender.net'
    this.senderName = 'Ken Yap Wei Chun'
    this.sender = new Sender(this.senderEmail, this.senderName)
  }

  createClient() {
    this.client = new MailerSendPkg({
      apiKey: MAILERSEND_TOKEN,
    })
  }

  /**
   * @param {{
   * recipient: { email: string; name: string; };
   * subject: string;
   * content: string;
   * }} sendEmailParams
   */
  async sendEmail({ recipient: { email, name }, subject, content }) {
    if (!this.client) {
      this.createClient()
    }

    try {
      const recipients = [new Recipient(email, name)]

      const emailParams = new EmailParams()
        .setFrom(this.sender)
        .setTo(recipients)
        .setReplyTo(this.sender)
        .setSubject(subject)
        .setHtml(content)

      await this.client.email.send(emailParams)
      console.log('Email has been successfully sent to: ', recipients, 'via ', this.sender)
    } catch (error) {
      console.log('Failed to send email, with error: ', error)
    }
  }
}

module.exports = new MailerSend()
