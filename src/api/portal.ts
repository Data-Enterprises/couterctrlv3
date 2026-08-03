import axios from "axios";

export interface WalkthroughRequest {
  name: string;
  company: string;
  email: string;
  phone?: string;
  role?: string;
  locations?: string;
  pos_system?: string;
  interest?: string;
  notes?: string;
}

export const requestWalkthrough = async (
  url: string,
  body: WalkthroughRequest,
) => {
  const json = await axios({
    method: "POST",
    url: url + "contact/walkthrough",
    data: body,
  });
  return json;
};

/** One object in the `mto-html-pages` bucket. */
export interface BlogFile {
  key: string;
  filename: string;
  size: number;
  last_modified: string;
  url: string;
}

export interface BlogListing {
  error: number;
  success: boolean;
  bucket: string;
  count: number;
  files: BlogFile[];
}

/** Lists what's in the bucket — keys and public URLs, not content. */
export const getBlogs = async (url: string) => {
  const json = await axios<BlogListing>({
    method: "GET",
    url: url + "html_pages/get_pages",
  });
  return json;
};

/** Second hop: the listing hands back URLs, so the content itself is fetched
 *  straight from S3. The bucket is public, so there's nothing to proxy and no
 *  credential involved — and there are no global axios interceptors here, so
 *  no app header leaks onto an S3 request. */
export const getBlogFile = async (fileUrl: string) => {
  const json = await axios({ method: "GET", url: fileUrl });
  return json;
};
