import whatsappService from './whatsappService.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    // Remove 1 from the position 2 in the from property
    const fromNumber = message.from.slice(0, 2) + message.from.slice(3);    
    /* console.log("hola  "+ fromNumber); */
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();   
      if(this.isGreeting(incomingMessage)){
        await this.sendWelcomeMessage(fromNumber, message.id, senderInfo);
        await this.sendWelcomeMenu(fromNumber);
      }else{
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(fromNumber, response, message.id);
      }      
      await whatsappService.markAsRead(message.id);
    }else if (message?.type === 'interactive'){
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(fromNumber, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message){
    const greetings = ["hola", "hello", "hi", "buenas tardes"];
    return greetings.includes(message)
  }

  getSenderName(senderInfo){
    return senderInfo.profile?.name || senderInfo.wa_id || "";
  }

  async sendWelcomeMessage(to, messageId, senderInfo){
    const name = this.getSenderName(senderInfo);
    //console.log(name.split(" ")?.[0]);
    const welcomeMessage = `Hola *${name.split(" ")?.[0]}*, Bienvenido a nuestra servicio de atención online. ¿En que puedo ayudarte el dia de hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to){
    const menuMessage = "Elige una opción";
    const buttons = [
      {
        type: 'reply', reply: { id: 'option_1', title: 'Agendar'}
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'Consultar'}
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Ubicación'}
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option){
    let response;
    switch (option){
      case 'agendar': 
        response = 'Agendar Cita';
        break;
      case 'consultar':
        response = 'realiza tu consulta';
        break;
      case 'ubicacion':
        response = 'Esta es nuestra ubicación';
        break;
      default:
        response = 'Lo siento no entendí tu selección, por favor, elige una de las opciones';
    }
    await whatsappService.sendMessage(to, response);
  }

}

export default new MessageHandler();