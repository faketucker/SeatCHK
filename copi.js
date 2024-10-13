import axios from 'axios';
import qs from 'qs';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    const { cinema_text } = req.body;

    try {
        const response = await axios.post(
            'https://www.majorcineplex.com/booking2/get_showtime',
            qs.stringify({
                cinema_text,
                date_link: '2024-10-13' // You can make this dynamic if needed
            })
        );

        const $ = cheerio.load(response.data);
        const movies = [];

        $('.bscbb-movie').each((index, movieElement) => {
            const title = $(movieElement).find('.bscbbm-cover-title').text().trim();
            const time = $(movieElement).find('.bscbbm-cover-time').text().replace(/\s+/g, ' ').trim();

            const theatres = [];
            $(movieElement).find('.bscbbm-theatre-list').each((index, theatreElement) => {
                const theatreInfo = {
                    theatre: '',
                    soundtrack: '',
                    showtimes: []
                };

                const theatreName = $(theatreElement).find('ul.bscbbmt.bscbbmt-movie li').first().text().trim();
                if (theatreName) {
                    theatreInfo.theatre = theatreName.replace('Theatre ', '').trim();
                }

                const soundtrack = $(theatreElement).find('ul.bscbbmt.bscbbmt-movie li').eq(1).text().trim();
                if (soundtrack) {
                    theatreInfo.soundtrack = soundtrack;
                }

                $(theatreElement).find('.nextst').each((index, nextstElement) => {
                    const nextst = $(nextstElement).text().trim();
                    const dataShowtime = $(nextstElement).attr('data-showtime');
                    if (nextst && dataShowtime) {
                        theatreInfo.showtimes.push({ time: nextst, dataShowtime });
                    }
                });

                theatres.push(theatreInfo);
            });

            movies.push({ title, time, theatres });
        });

        for (const movie of movies) {
            for (const theatre of movie.theatres) {
                for (const showtime of theatre.showtimes) {
                    const queryParams = qs.stringify({
                        _: '1728737645831',
                    });

                    const seatIdResponse = await axios.get(
                        `https://www.majorcineplex.com/booking2/get_seat/${showtime.dataShowtime}?${queryParams}`,
                    );

                    const takenSeatCount = (seatIdResponse.data.toLowerCase().match(/"status":1/gi) || []).length;
                    showtime.seatTaken = takenSeatCount;
                }
            }
        }

        res.status(200).json(movies);
    } catch (error) {
        console.error('Error fetching showtime:', error);
        res.status(500).json({ error: 'Error fetching showtime' });
    }
}