document.getElementById('fetchShowtimes').addEventListener('click', async () => {
    const cinemaText = document.getElementById('cinema').value;
    const showtimesDiv = document.getElementById('showtimes');
    showtimesDiv.innerHTML = '<div id="status">กำลังโหลด...<div>';

    try {
        const response = await fetch(`/api/get-showtimes?cinema_text=${cinemaText}`, {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        showtimesDiv.innerHTML = '';

        data.forEach(movie => {
            const movieDiv = document.createElement('div');
            movieDiv.classList.add('showtime');
            movieDiv.innerHTML = `<h2>${movie.title}</h2><p>ความยาวหนัง: ${movie.time}</p>`;

            movie.theatres.forEach(theatre => {
                const theatreDiv = document.createElement('div');
                theatreDiv.classList.add('theatre');
                theatreDiv.innerHTML = `<h3>โรงภาพยนตร์: ${theatre.theatre}</h3><p>Soundtrack: ${theatre.soundtrack}</p>`;

                const showtimeList = document.createElement('div');
                showtimeList.classList.add('showtime-list');
                theatre.showtimes.forEach(showtime => {
                    const showtimeDiv = document.createElement('div');
                    showtimeDiv.innerHTML = `รอบฉาย: ${showtime.time} ลูกค้า: ${showtime.seatTaken} คน`;
                    showtimeList.appendChild(showtimeDiv);
                });

                theatreDiv.appendChild(showtimeList);
                movieDiv.appendChild(theatreDiv);
            });

            showtimesDiv.appendChild(movieDiv);
        });
    } catch (error) {
        showtimesDiv.innerHTML = '<div id="status">เกิดข้อผิดพลาด</div>';
        console.error('Error fetching showtimes:', error);
    }
});