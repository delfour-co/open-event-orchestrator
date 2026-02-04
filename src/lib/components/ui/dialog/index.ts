import { Dialog as DialogPrimitive } from 'bits-ui'

import Content from './dialog-content.svelte'
import Description from './dialog-description.svelte'
import Footer from './dialog-footer.svelte'
import Header from './dialog-header.svelte'
import Title from './dialog-title.svelte'

const Root = DialogPrimitive.Root
const Trigger = DialogPrimitive.Trigger
const Close = DialogPrimitive.Close
const Portal = DialogPrimitive.Portal
const Overlay = DialogPrimitive.Overlay

export {
  Close,
  Content,
  Description,
  Footer,
  Header,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
  //
  Root as Dialog,
  Close as DialogClose,
  Content as DialogContent,
  Description as DialogDescription,
  Footer as DialogFooter,
  Header as DialogHeader,
  Overlay as DialogOverlay,
  Portal as DialogPortal,
  Title as DialogTitle,
  Trigger as DialogTrigger
}
