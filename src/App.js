import './App.css';
import {HashRouter as Router, Route, Switch} from 'react-router-dom'
import Settings from "./pages/Settings";
import Board from "./pages/Board";

export default function App() {
    return (
        <Router>
            <div className="App">
                <Switch>
                    <Route path="/" exact component={Settings}/>
                    <Route path="/board" component={Board}/>
                </Switch>
            </div>
        </Router>
    );
}