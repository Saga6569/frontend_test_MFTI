import { IState, IShift } from "./App";

export const myRequest = async (url: string, option = {}) => {
  try {
    const response = await fetch(url, option);
    if (response.status !== 200) {
      return { status: 'ERROR', value: response.status };
    }
    if (response === undefined) {
      return { status: 'ERROR', value: 'ошибка сети' };
    };
    const json = await response.json();
    return json;
  } catch (error) {
    return { status: 'ERROR', value: error };
  };
};

export const dragStart = (e: any, setShift: Function): void => {
  e.dataTransfer.setDragImage(new Image(), 10, 10);
  const x = e.clientX - e.target.getBoundingClientRect().left;
  const y = e.clientY - e.target.getBoundingClientRect().top;
  setShift({ x, y });
};

export const dragMove = (e: any, id: number, state: IState, setState: Function, key: string, shift: IShift) => {
  const maket = state[key].map((el: any) => {
    if (e.pageX === 0) {
      return el;
    };
    const myStyle = { left: e.pageX - shift.x, top: e.pageY - shift.y };
    return el.id === id ? { ...el, myStyle } : el
  });
  setState({ ...state, [key]: maket });
};
