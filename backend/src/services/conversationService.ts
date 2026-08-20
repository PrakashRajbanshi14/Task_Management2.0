import Conversation from "../database/models/conversationModel";


class ConversationService {

  // ==========================================
  // Normalize two user IDs
  // ==========================================

  private normalizeUserIds(
    userOneId: string,
    userTwoId: string,
  ) {

    const ids = [
      userOneId,
      userTwoId,
    ].sort();

    return {
      userOneId: ids[0],
      userTwoId: ids[1],
    };
  }


  // ==========================================
  // Find existing conversation
  // ==========================================

  async findConversation(
    userOneId: string,
    userTwoId: string,
  ) {

    const normalized =
      this.normalizeUserIds(
        userOneId,
        userTwoId,
      );

    return Conversation.findOne({
      where: normalized,
    });
  }


  // ==========================================
  // Get or create conversation
  // ==========================================

  async getOrCreateConversation(
    userOneId: string,
    userTwoId: string,
  ) {

    const normalized =
      this.normalizeUserIds(
        userOneId,
        userTwoId,
      );


    let conversation =
      await Conversation.findOne({
        where: normalized,
      });


    if (conversation) {
      return conversation;
    }


    conversation =
      await Conversation.create({
        userOneId:
          normalized.userOneId,

        userTwoId:
          normalized.userTwoId,
      });


    return conversation;
  }
}


export default new ConversationService();