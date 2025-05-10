import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Bienvenue dans le Catalogue des Loups-Garous de Thiercelieux</h1>
        <p className="home-subtitle">
          Découvrez toutes les cartes du jeu, leurs rôles, et les prochaines dates de parties.
        </p>
        <div className="home-buttons">
          <Link to="/cards" className="btn">
            Voir les Cartes
          </Link>
          <Link to="/calendar" className="btn btn-secondary">
            Consulter le Calendrier
          </Link>
        </div>
      </div>

      <div className="home-section">
        <h2>À propos du jeu</h2>
        <p>
          Les Loups-Garous de Thiercelieux est un jeu de société d'ambiance dans lequel chaque joueur incarne un villageois ou un loup-garou.
          Le but des villageois est de démasquer et éliminer tous les loups-garous, tandis que ces derniers doivent dévorer tous les villageois.
        </p>
        <p>
          Ce catalogue vous permet de découvrir toutes les cartes du jeu, leurs rôles spécifiques, et les stratégies associées.
        </p>
      </div>

      <div className="home-section">
        <h2>Prochains événements</h2>
        <p>
          Consultez notre <Link to="/calendar" className="home-link">calendrier</Link> pour découvrir les prochaines parties organisées près de chez vous.
        </p>
      </div>
    </div>
  );
};

export default Home;
