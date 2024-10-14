import axios from 'axios';
import qs from 'qs';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    const { cinema_text } = req.query;

    try {
        const response = await axios.post(
            'https://www.majorcineplex.com/booking2/get_showtime',
            qs.stringify({
                cinema_text, // ID สาขา
                date_link: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) // วันที่ YYYY-MM-DD GMT+7
            }),
            {
                headers: {
                   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                    'Referer': 'https://www.majorcineplex.com/',
                    'Origin': 'https://www.majorcineplex.com/',
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
                    'Connection': 'keep-alive',
                    'Host': 'www.majorcineplex.com',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin'
                }
            }
        );

        const $ = cheerio.load(response.data);
        const movies = [];

        // ไล่หาข้อมูลของหนังแต่ละเรื่อง
        $('.bscbb-movie').each(async (index, movieElement) => {
            // ดึงชื่อหนัง
            const title = $(movieElement).find('.bscbbm-cover-title').text().trim();
            // ดึงระยะเวลา
            const time = $(movieElement).find('.bscbbm-cover-time').text().replace(/\s+/g, ' ').trim();

            // เก็บรายชื่อโรงหนังเป็น array
            const theatres = [];
            $(movieElement).find('.bscbbm-theatre-list').each((index, theatreElement) => {
                // เก็บข้อมูลโรงหนังเป็น object
                const theatreInfo = {
                    theatre: '',
                    soundtrack: '',
                    // เก็บรอบหนังเป็น array
                    showtimes: []
                };

                // List item แรกคือชื่อ Theatre
                const theatreName = $(theatreElement).find('ul.bscbbmt.bscbbmt-movie li').first().text().trim();
                if (theatreName) {
                    // ตััดคำนำหน้า Theatre ออก
                    theatreInfo.theatre = theatreName.replace('Theatre ', '').trim();
                }

                // List item แรกคือ Soundtrack
                const soundtrack = $(theatreElement).find('ul.bscbbmt.bscbbmt-movie li').eq(1).text().trim();
                if (soundtrack) {
                    theatreInfo.soundtrack = soundtrack;
                }

                // ดึง Showtime ทั้งหมด
                $(theatreElement).find('.nextst').each((index, nextstElement) => {
                    const nextst = $(nextstElement).text().trim();
                    // ดึง id ของรอบหนังนั้น ๆ
                    const dataShowtime = $(nextstElement).attr('data-showtime');
                    if (nextst && dataShowtime) {
                        theatreInfo.showtimes.push({ time: nextst, dataShowtime });
                    }
                });

                // จัดเก็บเข้า array หลัก
                theatres.push(theatreInfo);
            });

            movies.push({ title, time, theatres });
        });

        // ลูปการดึงจำนวนที่นั่งที่จองไปแล้ว
        for (const movie of movies) {
            for (const theatre of movie.theatres) {
                // เอารอบหนังจากใน array showtimes ของ object theatre มาลูปทุกรอบ
                for (const showtime of theatre.showtimes) {
                    const queryParams = qs.stringify({
                        _: '1728737645831',  // เลขบอกถึงอะไรไม่รู้ แต่ต้องมีเพื่อ API รับ request
                    });

                    const seatIdResponse = await axios.get(
                        //ใช้เลขไอดีของรอบหนังนั้น ๆ ดึงข้อมูลจำนวนที่นั่งที่จองไปแล้ว
                        `https://www.majorcineplex.com/booking2/get_seat/${showtime.dataShowtime}?${queryParams}`,
                        {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
                                'Referer': 'https://www.majorcineplex.com/',
                                'Origin': 'https://www.majorcineplex.com/',
                                'Accept': '*/*',
                                'Accept-Encoding': 'gzip, deflate, br',
                                'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
                                'Connection': 'keep-alive',
                                'Host': 'www.majorcineplex.com',
                                'Sec-Fetch-Dest': 'empty',
                                'Sec-Fetch-Mode': 'cors',
                                'Sec-Fetch-Site': 'same-origin'
                            }
                        }
                    );

                    // นับจำนวนที่นั่งที่จองไปแล้ว โดยดูจาก status 1 คือมีคนจอง
                    const takenSeatCount = (seatIdResponse.data.toLowerCase().match(/"status":1/gi) || []).length;
                    showtime.seatTaken = takenSeatCount;
                    delete showtime.dataShowtime; // Remove dataShowtime from the response
                }
            }
        }

        res.status(200).json(movies);
    } catch (error) {
        console.error('Error fetching showtime:', error.message);
        res.status(500).json({ error: 'Error fetching showtime', details: error.message });
    }
}
