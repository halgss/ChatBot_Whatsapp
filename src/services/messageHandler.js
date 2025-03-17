import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAIService from './openAIService.js';

class MessageHandler {

  constructor(){
    this.appointmentState = {};
    this.assistandState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    // Remove 1 from the position 2 in the from property
    const fromNumber = message.from.slice(0, 2) + message.from.slice(3);    
    
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim(); 

      if(this.isGreeting(incomingMessage)){
        await this.sendWelcomeMessage(fromNumber, message.id, senderInfo);
        await this.sendWelcomeMenu(fromNumber);
      } else if(incomingMessage === 'media'){
        await this.sendMedia(fromNumber);
      } else if (this.appointmentState[fromNumber]) {        
          await this.handleAppointmentFlow(fromNumber, incomingMessage);
      } else if(this.assistandState[fromNumber]){
          await this.handleAssistandFlow(fromNumber, incomingMessage);
      } else {
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
    console.log(option);
    let response;
     
    switch (option.normalize("NFD").replace(/[\u0300-\u036f]/g, "")){
      case 'agendar': 
        this.appointmentState[to] = { step: 'name'}
        response = 'Por favor, ingresa tu nombre:';
        break;
      case 'consultar':
        this.appointmentState[to] = { step: 'question'}
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

  async sendMedia(to) {
/*     const mediaUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';
    const caption = 'Archivo de audio libre de copyright';
    const type ='audio'; */

    const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4';
    const caption = 'Archivo de video libre de copyright';
    const type ='video';

/*     const mediaUrl = 'https://www.um.es/docencia/barzana/DAWEB/Lenguaje-de-programacion-JavaScript-1.pdf';
    const caption = 'Archivo de PDF libre de copyright';
    const type ='document'; */

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  completeAppointment(to) {
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    const userData = [
      to,
      appointment.name,
      appointment.petName,
      appointment.petType,
      appointment.reason,
      new Date().toISOString()
    ]

    console.log(userData);
    appendToSheet(userData);

    return `Gracias por agendar tu cita.
    Resumen de tu cita:
    
     Nombre: ${appointment.name}
     Nombre de la mascota: ${appointment.petName}
     Tipo de mascota: ${appointment.petType}
     Motivo: ${appointment.reason}
    
    Nos pondremos en contacto contigo pronto para confirmar la fecha y hora de tu cita`;    
  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    let response;

    switch (state.step){
      case 'name':
        state.name = message;
        state.step = 'petName';
        response = "Gracias, ahora, ¿Cuál es el nombre de su mascota?";
        break;
      case 'petName':
        state.petName = message;
        state.step = 'petType';
        response = '¿Que tipo de mascota es? (por ejemplo: perro, gato, huron, etc.)';
        break;
      case 'petType':
          state.petType = message;
          state.step = 'reason';
          response = '¿Cuál es el motivo de la consulta?';
          break;
      case 'reason':
        state.reason = message;
        state.step = 'reason';
        response = this.completeAppointment(to);
        break;
    }
    await whatsappService.sendMessage(to, response);
  }

  async handleAssistandFlow(to, message){
    const state = this.assistandState[to];
    let response;

    const menuMessage = '¿La respuesta fue de tu ayuda';
    const buttons = [
      {type: 'reply', reply: { id: 'option_4', title: "Si"}},
      {type: 'reply', reply: { id: 'option_5', title: 'Tengo duda'}},
      {type: 'reply', reply: { id: 'option_6', title: 'Emergencia'}}
    ];

    if (state.step === 'question'){
      response = await openAIService(message);
    }

    delete this.assistandState(to);
    await whatsappService.sendMessage(to, response);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }
}

export default new MessageHandler();