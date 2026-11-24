import { useParams } from 'react-router-dom'
import Books from './Books'
export default function CategoryDetails() {
  const { slug } = useParams()
  return <Books mode="category" key={slug} />
}
