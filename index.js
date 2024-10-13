document.getElementById('fetchShowtimes').addEventListener('click', async () => {
    const cinemaText = document.getElementById('cinema').value;
    const showtimesDiv = document.getElementById('showtimes');
    showtimesDiv.innerHTML = 'Loading...';

    try {
        const response = await fetch('/api/getShowtimes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cinema_text: cinemaText })
        });
        const data = await response.json();
        showtimesDiv.innerHTML = '';

        data.forEach(movie => {
            const movieDiv = document.createElement('div');
            movieDiv.classList.add('showtime');
            movieDiv.innerHTML = `<h2>${movie.title}</h2><p>Runtime: ${movie.time}</p>`;

            movie.theatres.forEach(theatre => {
                const theatreDiv = document.createElement('div');
                theatreDiv.classList.add('theatre');
                theatreDiv.innerHTML = `<h3>Theatre: ${theatre.theatre}</h3><p>Soundtrack: ${theatre.soundtrack}</p>`;

                const showtimeList = document.createElement('div');
                showtimeList.classList.add('showtime-list');
                theatre.showtimes.forEach(showtime => {
                    const showtimeDiv = document.createElement('div');
                    showtimeDiv.innerHTML = `Showtime: ${showtime.time} Seat Taken: ${showtime.seatTaken}`;
                    showtimeList.appendChild(showtimeDiv);
                });

                theatreDiv.appendChild(showtimeList);
                movieDiv.appendChild(theatreDiv);
            });

            showtimesDiv.appendChild(movieDiv);
        });
    } catch (error) {
        showtimesDiv.innerHTML = 'Error fetching showtimes.';
        console.error('Error fetching showtimes:', error);
    }
});