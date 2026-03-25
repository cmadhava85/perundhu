import { render, screen } from "./test-utils";
import { FormTextArea } from "./components/ui/FormTextArea";

describe('Debug FormTextArea', () => {
  it('should render something', () => {
    const { container } = render(
      <FormTextArea
        id="test-textarea"
        value=""
        onChange={() => {}}
      />
    );
    
    console.log('Container HTML:', container.innerHTML);
    console.log('Document body:', document.body.innerHTML);
    screen.debug();
  });
});
