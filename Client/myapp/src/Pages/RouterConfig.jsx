// routesConfig.js
import Login from './Login/Login';
import CompanyList from './CompanyList/CompanyList';
import DashBoard from './DashBoard/DashBoard';

const routes = [
  {
    path: '/',
    element: Login,
    exact: true
  },
  {
    path: '/company-list',
    element: CompanyList
  },
  {
    path: '/dashboard',
    element: DashBoard
  }

];

export default routes;
