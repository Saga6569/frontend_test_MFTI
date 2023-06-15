import { useEffect, useState } from "react";
import { myRequest, dragStart, dragMove } from "./utilits";

interface INodes {
  id: number;
  name: string;
  color: string;
  toNode?: INodes[];
  dep?: number;
  myStyle?: { left: number, top: number };

}
interface IEdges {
  fromId: number;
  toId: number;
}

interface IGraphs {
  id: number;
}

export interface IState {
  edges: IEdges[];
  graphs: IGraphs[];
  initMaket: INodes[];
  newMaket: INodes[];
  [key: string]: INodes[] | IEdges[] | IGraphs[];
};
export interface IShift {
  x: number;
  y: number;
};

const randomColor = () => '#' + Math.random().toString(16).slice(3, 9);

const getGraphs = (state: IState, setState: Function) => {
  return (<div className="get_graphs" >
    <button
      onClick={async () => {
        const response: number[] = await myRequest(`/api/graphs/`);
        const graphs = response.map((el: number) => {
          const id = el;
          return { id };
        });
        setState({ ...state, graphs });
      }}
    >Запросить доступные графики</button>
  </div>)
};

const renderLine = (arr: INodes[]) => {
  if (arr === undefined) {
    return null;
  }
  const lines = arr.map((node: INodes) => {
    const style = node.myStyle;
    const el: any = arr.filter((el: INodes) => el.id === node.id)[0];
    if (!el.hasOwnProperty('toNode')) {
      return;
    };
    if (style === undefined) {
      return null;
    };
    const xStart = style.left + 105;
    const yStart = style.top + 20;
    const lineEnd = el.toNode.map((el: any, i: number) => {
      const elStyle = arr.filter((node) => node.id === el.id)[0];
      if (elStyle.myStyle === undefined) {
        return null;
      };
      const xEnd = elStyle.myStyle.left;
      const yEnd = elStyle.myStyle.top + 20;
      return <line key={i} x1={xStart} y1={yStart} x2={xEnd} y2={yEnd} stroke="black" />
    });
    return [...lineEnd];
  });
  return lines;
};

const App = () => {
  const initState = {} as IState;
  const [count, setCount] = useState(0);
  const [state, setState] = useState(initState);
  const [shift, setShift] = useState({ x: 0, y: 0 });

  console.log(state, 'state')

  useEffect(() => {
    const localStorageState = ((localStorage.getItem('state')));
    if (localStorageState !== null) {
      setState(JSON.parse(localStorageState));
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("state", JSON.stringify(state));
  }, [state]);


  const renderGraphs = () => {
    if (Object.keys(state).length === 0) {
      return getGraphs(state, setState);
    };

    const graphs = state.graphs?.map((el: IGraphs, i: number) => {
      return (<option key={i}  value={el.id}>{`график ${el.id + 1}`}</option>);
    });

    return (<div className="select_graphs">
      <div>Выберите график для визуализации</div>
      <select className="combobox" name="combobox"
        onClick={async (e: any) => {
          const targetId = Number(e.target.value);
          const response: { nodes: INodes[], edges: IEdges[] } = await myRequest(`/api/graphs/${targetId}`);

          const initMaket: INodes[] = structuredClone(response.nodes);
          const newMaket: INodes[] = structuredClone(response.nodes);

          const getStartNodes = () => {
            const arrFromId = response.edges.map((el) => el.fromId);
            const arrToId = response.edges.map((el) => el.toId);
            const idStart = arrFromId?.filter((el) => {
              if (arrToId?.includes(el)) {
                return false;
              };
              return true;
            });
            return [...new Set(idStart)];
          };

          const iter = (node: INodes, dep = 0, i = 0, perensNode?: INodes): any => {

            const elNewMaket = newMaket.filter((n: INodes) => n.id === node.id)[0];
            const eliInitMAket = initMaket.filter((n: INodes) => n.id === node.id)[0];

            node.dep = dep;
            eliInitMAket.dep = dep;

            dep++;

            const ToIdArr = response.edges.filter((el) => el.fromId === node.id).map((el) => el.toId);
            const toNode: INodes[] = response.nodes.filter((el) => ToIdArr.includes(el.id))

            const countChildrenEl = (id: number) => {
              const count = response.edges.reduce((count: number, el: IEdges) => {
                if (el.toId === id) {
                  count++;
                };
                return count;
              }, 0);
              return count;
            };

            toNode.sort((a: INodes, b: INodes): any => countChildrenEl(a.id) - countChildrenEl(b.id))

            if (node.myStyle === undefined) {
              const stylePerens = perensNode?.myStyle ?? { left: 0, top: 0 }
              const left = stylePerens.left + 200;
              const top = i === 0 ? stylePerens.top : stylePerens.top + 100;
              node.myStyle = { left, top };

              elNewMaket.myStyle = { left, top };

              elNewMaket.color = perensNode?.color ?? node.color;
            };

            if (toNode.length >= 1) {

              node.toNode = toNode;
              eliInitMAket.toNode = toNode;

              elNewMaket.toNode = toNode;
              return toNode.forEach((el: INodes, j) => {
                el.color = perensNode?.color ?? node.color
                return iter(el, dep, j, node);
              })
            };
            return node;
          };

          let top = 150;

          getStartNodes().map((id) => {
            const node: INodes[] = newMaket.filter((el) => el.id === id);
            const left = 800;
            node[0].myStyle = { left, top };
            node[0].color = randomColor();
            iter(node[0], 0);
            top += 100;
          });

          setState({ ...state, edges: response.edges, initMaket: initMaket, newMaket: newMaket });
          setCount(targetId);
        }}
      >
        {graphs}
      </select>
    </div>);
  };

  const renderInitMaket = (state: IState) => {
    if (!state.hasOwnProperty('initMaket')) {
      return null;
    };
    const arrDep = [...new Set(state.initMaket.map((el: any) => el.dep))].sort();
    const res = arrDep.map((dep: number) => {
      const arrDep = state.initMaket.filter((el: any) => el.dep === dep);
      return arrDep;
    });
    let accLft = 50;
    const content = res.map((row: INodes[]) => {
      let accTop = 150;
      const div = row.map((el: INodes | any, iEl) => {
        const id = el.id;
        const left = accLft;
        const top = accTop;
        const style = { left, top };
        accTop += 100;

        if (!el.hasOwnProperty('myStyle')) {
          const initMaket = state.initMaket.map((el: any) => {
            const myStyle = style;
            return el.id === id ? { ...el, myStyle } : el
          });
          setState({ ...state, initMaket });
        };
        return <div key={iEl} className="box" style={el.myStyle}
          onDragStart={(e: any) => dragStart(e, setShift)}
          onDrag={(e: any) => dragMove(e, id, state, setState, 'initMaket', shift)}
        ><p>{el.name}</p></div>
      });
      accLft += 200;
      return div;
    });
    return content;
  };

  const renderNewMaket = (state: IState) => {
    if (!state.hasOwnProperty('newMaket')) {
      return null;
    };

    const arr = state.newMaket.map((el: INodes, i: number) => {
      const id = el.id;
      const box = <div key={i} className="box" style={{ ...el.myStyle, backgroundColor: el.color }}
        onDragStart={(e: any) => dragStart(e, setShift)}
        onDrag={(e: any) => dragMove(e, id, state, setState, 'newMaket', shift)}
      ><p>{el.name}</p></div>
      return box;
    });
    return arr;
  };

  return <div>
    {renderGraphs()}
    {renderInitMaket(state)}
    <svg className="zone">
      {renderLine(state.initMaket)}
      {renderLine(state.newMaket)}
    </svg>
    <div>
      {renderNewMaket(state)}
    </div>
  </div>
};

export default App;
