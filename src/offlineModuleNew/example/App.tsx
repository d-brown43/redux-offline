import {useDispatch, useSelector} from "react-redux";
import {decreaseClickCount, increaseClickCount} from "./redux";

const App = () => {
  const dispatch = useDispatch();
  const state = useSelector(state => state);
  const clickCount = useSelector(state => {
    return (state as any).myState.clickCount;
  });

  return (
    <div>
      <p>Click count: {clickCount}</p>
      <button onClick={() => dispatch(decreaseClickCount())}>
        Decrease
      </button>
      <button onClick={() => dispatch(increaseClickCount())}>
        Increase
      </button>
      <pre>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
};

export default App;
