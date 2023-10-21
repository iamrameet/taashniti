/// <reference path="../library/ui-component.js"/>

/** @extends {UIComponent<HTMLDivElement, {}>} */
class ComboBox extends UIComponent {

  constructor(){
    const options = [];
    const { element } = UIComponent.fromTagName("div")
      .append(
        UIComponent.fromTagName("input", { type: "text" })
          .attr({ list: "listId" })
          .style({ padding: "1rem" })
          .element,
        UIComponent.fromTagName("datalist", { id: "listId" })
          .append(
            ...options.map(option => UIComponent.fromTagName("option", {
              value: option.value
            }))
          ).element
      )
      .style({ border: "1px solid #000" });
    super(element);
  }

};