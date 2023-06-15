import React from "react";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import graphs from "../src/mocks/graphs";
import App from "../src/App";

function setup(jsx: JSX.Element) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

test("App renders", () => {
  render(<App />);
});

test("There is a dropdown with all the available graphs", () => {
  const { getByRole } = setup(<App />);
  const options = within(getByRole("combobox")).getAllByRole("option");

  expect(options.length).toBe(graphs.length);
});

test("Graph selected by dropdown is rendered", async () => {
  const selectedGraph = 2;
  const { getByRole, findByText, user } = setup(<App />);

  user.selectOptions(getByRole("combobox"), `${selectedGraph}`);

  for (let node of graphs[selectedGraph].nodes) {
    await findByText(node.name);
  }
});

test("Nodes in simple graph are organized into columns", async () => {
  const selectedGraph = 1;
  const { getByRole, findByText, user } = setup(<App />);

  const correctColumns = [["start"], ["foo", "bar"], ["end1", "end2"]];

  user.selectOptions(getByRole("combobox"), `${selectedGraph}`);

  for (let idx = 0; idx < correctColumns.length; idx++) {
    const col = correctColumns[idx];
    const otherCols = correctColumns.flatMap((c, i) => (i === idx ? [] : c));
    // find the common parent which doesn't hold any other columns
    let parent = await findByText(col[0]);
    while (parent) {
      parent = parent.parentElement as HTMLElement;
      const hasEveryCorrect = col.every((n) => !!within(parent).queryByText(n));
      const doesntHaveAnyOther = otherCols.every(
        (n) => !within(parent).queryByText(n)
      );
      if (hasEveryCorrect) {
        expect(doesntHaveAnyOther).toBeTruthy();
        break;
      }
    }

    // make sure we found a parent that contained the current column
    expect(parent).not.toBeNull();
  }
});
