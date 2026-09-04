const requireBlankLineBetweenFormFields = {
  meta: {
    type: "layout",
    docs: {
      description: "Require blank lines between direct form fields",
    },
    schema: [],
    messages: {
      blankLine: "Separate form fields with a blank line.",
    },
  },
  create: (context) => ({
    JSXElement: (node) => {
      if (node.openingElement.name.name !== "form") {
        return;
      }

      const fields = node.children.filter((child) => child.type === "JSXElement");
      for (const [index, currentField] of fields.entries()) {
        if (index === 0) {
          continue;
        }

        const previousField = fields[index - 1];
        if (currentField.loc.start.line - previousField.loc.end.line < 2) {
          context.report({ node: currentField, messageId: "blankLine" });
        }
      }
    },
  }),
};

export default requireBlankLineBetweenFormFields;
