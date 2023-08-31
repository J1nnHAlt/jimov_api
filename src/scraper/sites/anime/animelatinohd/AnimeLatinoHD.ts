import * as cheerio from "cheerio";
import axios from "axios";
import { Anime } from "../../../../types/anime";
import { Episode, EpisodeServer } from "../../../../types/episode";
import { AnimeSearch, ResultSearch, IResultSearch, IAnimeSearch } from "../../../../types/search";

export class AnimeLatinoHD {
    readonly url = "https://www.animelatinohd.com";
    readonly api = "https://api.animelatinohd.com";

    async GetAnimeInfo(anime: string): Promise<Anime> {
        try {
            const { data } = await axios.get(`${this.url}/anime/${anime}`);
            const $ = cheerio.load(data);

            let animeInfoParseObj = JSON.parse($("#__NEXT_DATA__").html()).props.pageProps.data

            const AnimeInfo: Anime = {
                name: animeInfoParseObj.name,
                url: `/anime/animelatinohd/name/${anime}`,
                synopsis: animeInfoParseObj.overview,
                alt_name: [...animeInfoParseObj.name_alternative.split(",")],
                image: {
                    url: "https://www.themoviedb.org/t/p/original" + animeInfoParseObj.poster + "?&w=53&q=95"
                },
                genres: [...animeInfoParseObj.genres.split(",")],
                type: animeInfoParseObj.type,
                status: animeInfoParseObj.status == 1 ? "En emisión" : "Finalizado",
                date: animeInfoParseObj.aired,
                episodes: []
            }

            animeInfoParseObj.episodes.map(e => {
                let AnimeEpisode: Episode = {
                    name: animeInfoParseObj.name,
                    number: e.number + "",
                    image: "https://www.themoviedb.org/t/p/original" + animeInfoParseObj.banner + "?&w=280&q=95",
                    url: `/anime/animelatinohd/episode/${animeInfoParseObj.slug + "-" + e.number}`
                }

                AnimeInfo.episodes.push(AnimeEpisode);
            })

            return AnimeInfo;

        } catch (error) {
        }
    }
    async GetEpisodeServers(episode: string, lang: string): Promise<Episode> {
        try {

            let number = episode.substring(episode.lastIndexOf("-") + 1)
            let anime = episode.substring(0, episode.lastIndexOf("-"))
            let langType = [{ lang: "es", type: "Latino" }, { lang: "jp", type: "Subtitulado" }]

            const { data } = await axios.get(`${this.url}/ver/${anime}/${number}`);
            const $ = cheerio.load(data);

            let animeEpisodeParseObj = JSON.parse($("#__NEXT_DATA__").html()).props.pageProps.data


            const AnimeEpisodeInfo: Episode = {
                name: animeEpisodeParseObj.anime.name,
                url: `/anime/animelatinohd/episode/${episode}`,
                number: number,
                image: "",
                servers: []
            }


            let sel_lang = langType.filter((e) => e.lang == lang)
            let f_index = 0
        
            if (sel_lang.length) {
                $("#languaje option").each((_i, e) => {
                    if ($(e).text() == sel_lang[0].type) {
                        f_index = Number($(e).val())
                    }
                })
            }


            await Promise.all(animeEpisodeParseObj.players[f_index].map(async (e: { server: { title: any; }; id: string; }) => {
                let min = await axios.get("https://api.animelatinohd.com/stream/" + e.id, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.62", "Referer": "https://www.animelatinohd.com/" } })
                let dat = cheerio.load(min.data)

                let Server: EpisodeServer = {
                    name: e.server.title,
                    url: "",
                }

                //state 1
                if (e.server.title == "Beta") {
                    let sel = dat("script:contains('var foo_ui = function (event) {')")
                    let sort = String(sel.html())
                    let domain = eval(sort.slice(sort.search("const url"), sort.search("const langDef")).replace("const url =", "").trim())

                    let sortMORE = sort.slice(sort.search('ajax'), sort.search("method: 'post',"))
                    let obj_sort = sortMORE.replace("ajax({", "").trim().replace("url:", "").replace(",", "").replace('"', "").replace('"', "").trim()
                    let id_file = obj_sort.slice(obj_sort.lastIndexOf("/"), obj_sort.length)
                    Server.url = domain + "/v" + id_file

                } else if (e.server.title == "Gamma") {
                    Server.url = dat('meta[name="og:url"]').attr("content")
                } else {
                    let sel = dat("script[data-cfasync='false']")
                    let sort = String(sel.html())
                    let sortMORE = sort.slice(sort.lastIndexOf("master") + 7, sort.lastIndexOf("hls2") - 11)
                    let id_file = sortMORE.replace("_x", "")
                    Server.url = "https://filemoon.sx" + "/e/" + id_file
                }
                AnimeEpisodeInfo.servers.push(Server)
            }))

            return AnimeEpisodeInfo;
        } catch (error) {
        }
    }

    async GetAnimeByFilter(search?: string, type?: number, page?: number, year?: string, genre?: string): Promise<IResultSearch<IAnimeSearch>> {
        try {
            const { data } = await axios.get(`${this.api}/api/anime/list`, {
                params: {
                    search: search,
                    type: type,
                    year: year,
                    genre: genre,
                    page: page
                }
            });

            let animeSearchParseObj = data

            const animeSearch: ResultSearch<IAnimeSearch> = {
                nav: {
                    count: animeSearchParseObj.data.length,
                    current: animeSearchParseObj.current_page,
                    next: animeSearchParseObj.data.length < 28 ? 0 : animeSearchParseObj.current_page + 1,
                    hasNext: animeSearchParseObj.data.length < 28 ? false : true
                },
                results: []
            }
            animeSearchParseObj.data.map(e => {
                const animeSearchData: AnimeSearch = {
                    name: e.name,
                    image: "https://www.themoviedb.org/t/p/original" + e.poster + "?&w=53&q=95",
                    url: `/anime/animelatinohd/name/${e.slug}`,
                    type: ""
                }
                animeSearch.results.push(animeSearchData)
            })
            return animeSearch;
        } catch (error) {
            console.log(error)
        }
    }

}


