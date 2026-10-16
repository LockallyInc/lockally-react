export { LockallyProvider, useLockally, type LockallyProviderProps } from './context.js';
export { useContacts, useTemplates, type AsyncState } from './hooks.js';
export {
  EmailComposer,
  ContactPicker,
  AttachmentUpload,
  TemplateSelector,
  SignaturePicker,
  type EmailComposerProps,
  type ContactPickerProps,
  type AttachmentUploadProps,
  type TemplateSelectorProps,
  type SignaturePickerProps,
} from './components.js';

// Re-export the core types so consumers get them from one place.
export type {
  Attachment,
  Contact,
  Template,
  Signature,
  SendMessage,
  SendResult,
  GetToken,
  LockallyAuth,
} from '@lockally/ui-core';
export { LockallyClient, LockallyError, fileToAttachment } from '@lockally/ui-core';
