import Quill from 'quill';

const Block = Quill.import('blots/block');

export class TestBlot extends Block {
  public static blotName = 'marquee';
  public static tagName = 'marquee';
}
